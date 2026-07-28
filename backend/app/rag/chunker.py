from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150):
    """
    Chunk raw text using LangChain's RecursiveCharacterTextSplitter.
    Token-aware and structure-aware.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""],  # fallback sequence
    )

    docs = splitter.split_text(text)

    chunks = []
    for i, chunk in enumerate(docs):
        chunks.append({
            "index": i,
            "text": chunk
        })
    return chunks
