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

    # Re-ranking: Cross-Encoder to verify relevance before generation
    # Since routes cannot be modified to pass a user query, we synthesize a 'Query intent' 
    try:
        from app.services.pdf_service import rerank_chunks
        query_intent = "Identify the core abstract, main concepts, and technical definitions."
        # Keep top chunks using the cross-encoder logic
        if len(docs) > 3:
            docs = rerank_chunks(query_intent, docs, top_k=min(len(docs), 15))
    except Exception as e:
        print(f"Failed to rerank: {e}")

    return "\n\n".join(docs)


def store_summary(summary_text, collection_name, pdf_filename):
    client = get_client()
    doc_id = os.path.splitext(os.path.basename(pdf_filename))[0] + "_summary"

    collection = client.get_or_create_collection(name=collection_name)
    collection.add(documents=[summary_text], ids=[doc_id])
