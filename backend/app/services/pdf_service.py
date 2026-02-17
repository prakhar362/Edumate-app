import fitz
import re
import os
import requests

API_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction"

headers = {
    "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
    "Content-Type": "application/json"
}


# ----------------------------
# Extract PDF text from bytes
# ----------------------------
def extract_chunks_from_bytes(pdf_bytes: bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page in doc:
        full_text += page.get_text("text") + "\n"

    chunks = re.split(r'\n(?=\d+\.\s|[A-Z][^\n]{3,40}\n)', full_text)
    return [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]


# ----------------------------
# Get embeddings via API
# ----------------------------
def get_embeddings(chunks):
    """
    Calls HuggingFace Inference API to generate embeddings.
    No local model loading.
    """

    response = requests.post(
        API_URL,
        headers=headers,
        json={"inputs": chunks},
        timeout=60
    )

    if response.status_code != 200:
        raise Exception(f"HuggingFace API error: {response.text}")

    embeddings = response.json()

    return embeddings
