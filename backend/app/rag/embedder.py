from sentence_transformers import SentenceTransformer
from typing import List

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Takes a list of texts and returns a list of embedding vectors.
    Uses Groq's 'nomic-embed-text' model.
    """

    vectors = model.encode(
        texts,
        batch_size=16,
        convert_to_numpy=True
    )

    return vectors.tolist()   


