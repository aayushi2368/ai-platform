from sqlalchemy.orm import Session
from sqlalchemy import text
from app.rag.embedder import embed_texts
from app.db.models import Chunk


def retrieve_top_k_chunks(db: Session, query: str,document_id: str, k: int = 5):
    
    """
    Embed the user query, then retrieve top-K similar chunks using pgvector.
    """

    # 1) Embed query
    embedding = embed_texts([query])[0]

    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"


    # 2) Sql query using cosine disatnce
    sql = text("""
    SELECT
        id,
        document_id,
        text,
        chunk_index,
        (embedding <=> :query_embedding) AS distance
    FROM chunks
    WHERE document_id = :doc_id
    ORDER BY distance ASC
    LIMIT :k
""")

    rows = db.execute(sql, {
        "query_embedding": embedding_str,
        "k": k,
        "doc_id": document_id
    }).fetchall()


     # 3) Convert result rows into clean dicts

    return [
        {
            "id": str(r.id),
            "document_id": str(r.document_id),
            "text": r.text,
            "chunk_index": r.chunk_index,
            "distance": float(r.distance)
        }
        for r in rows
    ]




    