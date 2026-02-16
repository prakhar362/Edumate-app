import fitz
import re

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


from io import BytesIO

def extract_chunks_from_bytes(pdf_bytes: bytes):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page in doc:
        full_text += page.get_text("text") + "\n"

    chunks = re.split(r'\n(?=\d+\.\s|[A-Z][^\n]{3,40}\n)', full_text)
    return [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]


def get_embeddings(chunks):
    model = get_model()
    return model.encode(chunks, show_progress_bar=False)
