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
    Uses a 3-tier Resilient Fallback Framework:
    Tier 1: Hugging Face Serverless Inference API (MS-Marco Cross-Encoder)
    Tier 2: Custom Hosted Hugging Face Space Endpoint (/rerank)
    Tier 3: Graceful Bypass (Return chunks in original dense vector order without re-ranking)
    """
    # 1️⃣ TIER 1: Hugging Face Serverless Inference API
    try:
        print("🚀 [Tier 1] Invoking Hugging Face Serverless Inference API for Cross-Encoder re-ranking...")
        response = requests.post(
            CROSS_ENCODER_API_URL, 
            headers=get_hf_headers(), 
            json={"inputs": {"source_sentence": query, "sentences": chunks}},
            timeout=25
        )
        if response.status_code == 200:
            scores = response.json()
            if isinstance(scores, list):
                # Sort chunks by cross encoder confidence scores
                ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)
                print("✅ [Tier 1] Successfully re-ranked chunks via Serverless Cross-Encoder!")
                return [chunk for chunk, score in ranked[:top_k]]
        print(f"⚠️ [Tier 1] Cross-Encoder Serverless returned status {response.status_code}")
    except Exception as e:
        print(f"⚠️ [Tier 1] Cross-Encoder Serverless failed: {e}")

    # 2️⃣ TIER 2: Custom Hosted Hugging Face Space Endpoint
    HF_SPACE_URL = os.environ.get("HF_SPACE_URL", "")
    if HF_SPACE_URL:
        try:
            print(f"🚀 [Tier 2] Invoking Custom Hosted Hugging Face Space at {HF_SPACE_URL}/rerank...")
            space_endpoint = f"{HF_SPACE_URL.rstrip('/')}/rerank"
            payload = {"query": query, "chunks": chunks}
            headers = {"Content-Type": "application/json"}
            
            response = requests.post(space_endpoint, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                res_json = response.json()
                ranked_chunks = res_json.get("chunks") or res_json.get("ranked_chunks")
                if isinstance(ranked_chunks, list) and len(ranked_chunks) > 0:
                    print("✅ [Tier 2] Successfully re-ranked chunks via Custom Hosted HF Space!")
                    return ranked_chunks[:top_k]
            print(f"⚠️ [Tier 2] Space re-rank endpoint returned code {response.status_code}")
        except Exception as e:
            print(f"⚠️ [Tier 2] Custom Space Cross-Encoder failed: {e}")
    else:
        print("ℹ️ [Tier 2] Skipped (HF_SPACE_URL environment variable is not configured)")

    # 3️⃣ TIER 3: Graceful Bypass (Fallback)
    print("🧠 [Tier 3] Falling back to default dense retrieval chunks (no re-ranking)...")
    return chunks[:top_k]
