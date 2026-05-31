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
    """
    Stores document chunks and embeddings in ChromaDB, wrapping execution in a try-except block 
    to prevent pipeline failure under cloud quota or rate limit exhaustion.
    """
    try:
        client = get_client()
        collection = client.get_or_create_collection(name=collection_name)
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            collection.add(
                documents=[chunk],
                embeddings=[embedding],
                ids=[f"chunk-{idx}"]
            )
        print("✅ Document chunks successfully indexed in ChromaDB.")
    except Exception as e:
        print(f"⚠️ ChromaDB Chunk Storage bypassed (Quota/API limit): {e}")



def fetch_combined(collection_name):
    """
    Fetches and re-ranks combined context from ChromaDB. Wraps execution in try-except block 
    to handle empty databases or quota restrictions gracefully.
    """
    docs = []
    try:
        client = get_client()
        collection = client.get_collection(name=collection_name)

        offset, limit = 0, 100
        while True:
            result = collection.get(include=["documents"], offset=offset, limit=limit)
            if not result or "documents" not in result or not result["documents"]:
                break
            docs += result["documents"]
            if len(result["documents"]) < limit:
                break
            offset += limit
    except Exception as e:
        print(f"⚠️ ChromaDB Retrieval bypassed (empty DB or quota limit): {e}")

    # Re-ranking: Cross-Encoder to verify relevance before generation
    if docs:
        try:
            from app.services.pdf_service import rerank_chunks
            query_intent = "Identify the core abstract, main concepts, and technical definitions."
            # Keep top chunks using the cross-encoder logic
            if len(docs) > 3:
                docs = rerank_chunks(query_intent, docs, top_k=min(len(docs), 15))
        except Exception as e:
            print(f"⚠️ Failed to rerank: {e}")

    return "\n\n".join(docs)



def store_summary(summary_text, collection_name, pdf_filename):
    """
    Stores summary in ChromaDB. Truncates text to fit within ChromaDB Cloud free quota limits 
    and catches all errors to prevent breaking the core user pipeline.
    """
    try:
        client = get_client()
        doc_id = os.path.splitext(os.path.basename(pdf_filename))[0] + "_summary"

        # Truncate summary text to 12,000 characters (~12 KB) to stay safely below 16KB quota limit
        safe_text = summary_text[:12000]

        collection = client.get_or_create_collection(name=collection_name)
        collection.add(documents=[safe_text], ids=[doc_id])
        print("✅ Summary stored in ChromaDB safely.")
    except Exception as e:
        print(f"⚠️ ChromaDB Summary Storage bypassed (Quota/API limit): {e}")

