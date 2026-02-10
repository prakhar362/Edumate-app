import fitz
import re
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_chunks(pdf_path: str):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text("text") + "\n"

    chunks = re.split(r'\n(?=\d+\.\s|[A-Z][^\n]{3,40}\n)', full_text)
    return [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]

def get_embeddings(chunks):
    return model.encode(chunks, show_progress_bar=True)
