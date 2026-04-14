import fitz
import re
import os
import requests
from dotenv import load_dotenv

API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"
CROSS_ENCODER_API_URL = "https://api-inference.huggingface.co/models/cross-encoder/ms-marco-MiniLM-L-6-v2"

def get_hf_headers():
    # Force dotenv to override any stale tokens stuck in your Windows terminal session
    load_dotenv(override=True)
    return {
        "Authorization": f"Bearer {os.environ.get('HF_TOKEN', '')}",
        "Content-Type": "application/json"
    }

# ----------------------------
# Extract PDF text hierarchically
# ----------------------------
def extract_chunks_from_bytes(pdf_bytes: bytes):
    """
    Hierarchical RAG: Extracts text and groups it by sections rather than arbitrary flat chunks.
    Maintains context-aware chunk selection.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page in doc:
        full_text += page.get_text("text") + "\n"

    # Split by major headings (e.g., "1. Introduction", "Abstract", etc.)
    # Fallback to double newline if headings are not found
    raw_chunks = re.split(r'\n(?=\d+\.\s+[A-Z]|[A-Z][A-Z\s]{3,40}\n)', full_text)
    
    hierarchical_chunks = []
    current_section = "Intro"
    for chunk in raw_chunks:
        if len(chunk.strip()) > 50:
            lines = chunk.strip().split('\n')
            if len(lines[0]) < 60 and lines[0].isupper():
                 current_section = lines[0]
            hierarchical_chunks.append(f"[SECTION: {current_section}] " + chunk.strip())
            
    return hierarchical_chunks

# ----------------------------
# Get embeddings via API
# ----------------------------
def get_embeddings(chunks):
    """
    Calls HuggingFace Inference API to generate embeddings.
    """
    response = requests.post(API_URL, headers=get_hf_headers(), json={"inputs": chunks}, timeout=60)

    if response.status_code != 200:
        raise Exception(f"HuggingFace API error: {response.text}")

    return response.json()

# ----------------------------
# Re-Ranking (Cross-Encoder)
# ----------------------------
def rerank_chunks(query: str, chunks: list, top_k: int = 5) -> list:
    """
    Integrates a Cross-Encoder re-ranking model after retrieval.
    """
    try:
        response = requests.post(
            CROSS_ENCODER_API_URL, 
            headers=get_hf_headers(), 
            json={"inputs": {"source_sentence": query, "sentences": chunks}},
            timeout=60
        )
        if response.status_code == 200:
            scores = response.json()
            # Sort chunks by cross encoder confidence scores
            ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)
            return [chunk for chunk, score in ranked[:top_k]]
    except Exception as e:
        print(f"Cross Encoder Re-ranking failed, falling back randomly: {e}")
    
    return chunks[:top_k]
