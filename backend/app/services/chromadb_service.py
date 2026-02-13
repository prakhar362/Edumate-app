import os
import chromadb
from app.config import CHROMA_API_KEY, TENANT_ID, DB_NAME

_client = None

def get_client():
    global _client
    if _client is None:
        _client = chromadb.CloudClient(
            api_key=CHROMA_API_KEY,
            tenant=TENANT_ID,
            database=DB_NAME
        )
    return _client


def store_chunks(chunks, embeddings, collection_name):
    client = get_client()
    collection = client.get_or_create_collection(name=collection_name)
    for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"chunk-{idx}"]
        )


def fetch_combined(collection_name):
    client = get_client()
    collection = client.get_collection(name=collection_name)

    docs = []
    offset, limit = 0, 100
    while True:
        result = collection.get(include=["documents"], offset=offset, limit=limit)
        docs += result["documents"]
        if len(result["documents"]) < limit:
            break
        offset += limit

    return "\n\n".join(docs)


def store_summary(summary_text, collection_name, pdf_filename):
    client = get_client()
    doc_id = os.path.splitext(os.path.basename(pdf_filename))[0] + "_summary"

    collection = client.get_or_create_collection(name=collection_name)
    collection.add(documents=[summary_text], ids=[doc_id])
