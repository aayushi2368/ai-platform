from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.connection import SessionLocal
from app.db.models import Document, Chunk
from app.rag.pdf_loader import extract_text_from_pdf
from app.rag.chunker import chunk_text
from app.rag.embedder import embed_texts
from app.rag.retriever import retrieve_top_k_chunks
from fastapi import Body
from app.rag.retriever import retrieve_top_k_chunks
from app.rag.prompt_builder import build_rag_prompt
from app.rag.llm_client import ask_llm
import time
from app.auth.deps import get_current_user
from app.chat.models import Chat,Message
import json





rag_router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@rag_router.post("/upload")
def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db),  user = Depends(get_current_user)):
    # 1) Check file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed.")
    
    # 2) Read PDF bytes
    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="File is empty.")
    
    # 3) Extract text
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="No extractable text found.")
    
    # 4)Create document
    doc = Document(name=file.filename, user_id=user.id)
    db.add(doc)
    db.flush()

    # 5) Chunk Text
    chunks = chunk_text(text)

    # 6) Embed chunk texts
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)

    # 7) Save chunks
    to_presist = []
    for i, chunk in enumerate(chunks):
        to_presist.append(
            Chunk(
                document_id = doc.id,
                text=chunk["text"],
                chunk_index=chunk["index"],
                embedding=embeddings[i],
            )
        )
    
    db.add_all(to_presist)
    db.commit()

    return {
        "document_id": str(doc.id),
        "filename": file.filename,
        "num_chunks": len(chunks),
    }


@rag_router.post("/query")
def query_rag(payload: dict = Body(...), db: Session = Depends(get_db)):
    question = payload.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    top_chunks = retrieve_top_k_chunks(db, question, k=5)

    return {
        "question": question,
        "chunks": top_chunks
    }


@rag_router.post("/answer")
def rag_answer(payload: dict = Body(...), db: Session = Depends(get_db), user = Depends(get_current_user)):
    
    question = payload.get("question")
    top_k = payload.get("top_k", 5)
    debug = payload.get("debug", False)
    document_id = payload.get("document_id")
    chat_id = payload.get("chat_id")

    if not chat_id:
        raise HTTPException(400, "chat_id is required")
    
    if not document_id:
        raise HTTPException(400, "document_id is required.")


    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")
    
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user.id
    ).first()

    if not chat:
        raise HTTPException(403, "You do not have access to this chat.")

    # Ensure chat is tied to the same document
    if str(chat.document_id) != str(document_id):
        raise HTTPException(400, "Chat is not bound to this document.")
    
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user.id
    ).first()

    if not doc:
        raise HTTPException(403, "Unauthorized access to document.")
    
    user_msg = Message(
    chat_id=chat_id,
    role="user",
    content=question,
    sources=None,
    meta=None
    )   

    db.add(user_msg)
    db.commit()

    # Step 1: retrieve chunks
    chunks = retrieve_top_k_chunks(db, question, document_id, top_k)

    # Step 2: build prompt
    prompt = build_rag_prompt(question, chunks)

    # Step 3: ask the LLM
    start = time.time()
    answer = ask_llm(prompt)
    end = time.time()

    latency = int((end - start) * 1000)

    # Save assistant message
    assistant_msg = Message(
        chat_id=chat_id,
        role="assistant",
        content=answer["answer"],
        sources=json.dumps(answer.get("sources")),
        meta=json.dumps({
            "latency_ms": latency,
            "model": "llama-3.3-70b",
            "top_k": top_k
        })
    )

    db.add(assistant_msg)
    db.commit()


    result = {
    "question": question,
    "answer": answer["answer"],
    "sources": answer["sources"],

    "retrieval": {
        "document_id": document_id,
        "top_k": top_k,
        "chunks": chunks
    },

    "meta": {
        "model": "llama-3.3-70b",
        "latency_ms": latency
        
    }
}
    
    if debug:
        result["debug"] = {"prompt": prompt}

    return result


@rag_router.get("/test")
def test():
    return {"msg": "rag works"}
