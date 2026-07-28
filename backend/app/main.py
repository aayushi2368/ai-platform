from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import Base, engine
from sqlalchemy import text
from dotenv import load_dotenv
from app.db.init_db import init_db





load_dotenv()

# ✅ Import models BEFORE creating tables
from app.db.models import Document, Chunk

init_db()

from app.sql.router import sql_router
from app.rag.router import rag_router
from app.auth.router import auth_router
from app.chat.router import chat_router



# Enable pgvector extension
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    conn.commit()



app = FastAPI(title="AI Platform", version="1.0.0")

# CORS so React can call our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# Later these will work
app.include_router(rag_router, prefix="/rag", tags=["RAG"])
app.include_router(auth_router)
app.include_router(sql_router)
app.include_router(chat_router)
