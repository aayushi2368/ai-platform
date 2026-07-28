from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.db.connection import get_db
from app.auth.deps import get_current_user
from app.chat.models import Chat, Message
from app.db.models import Document

from pydantic import BaseModel

chat_router = APIRouter(prefix="/chats", tags=["chats"])


class CreateChatRequest(BaseModel):
    title: str
    document_id: str


class MessageRequest(BaseModel):
    chat_id: str
    role: str
    content: str
    sources: dict | None = None
    meta: dict | None = None



@chat_router.post("/create")
def create_chat(req: CreateChatRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):

    # check user owns document
    document = db.query(Document).filter(
        Document.id == req.document_id,
        Document.user_id == user.id
    ).first()

    if not document:
        raise HTTPException(403, "You don't have access to this document")

    chat = Chat(
        user_id=user.id,
        title=req.title,
        document_id=req.document_id
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return {
        "chat_id": str(chat.id),
        "title": chat.title,
        "document_id": str(chat.document_id),
        "created_at": str(chat.created_at)
    }

@chat_router.get("/list")
def list_chats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    chats = db.query(Chat).filter(Chat.user_id == user.id).order_by(Chat.created_at.desc()).all()

    return [
        {
            "chat_id": str(c.id),
            "title": c.title,
            "document_id": str(c.document_id),
            "created_at": str(c.created_at)
        }
        for c in chats
    ]


@chat_router.get("/{chat_id}/messages")
def get_chat_messages(chat_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):

    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user.id
    ).first()

    if not chat:
        raise HTTPException(403, "No access to this chat")

    msgs = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()

    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "sources": m.sources,
            "meta": m.meta,
            "created_at": str(m.created_at)
        }
        for m in msgs
    ]


@chat_router.post("/messages")
def add_message(req: MessageRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
    
    # verify chat belongs to user
    chat = db.query(Chat).filter(
        Chat.id == req.chat_id,
        Chat.user_id == user.id
    ).first()

    if not chat:
        raise HTTPException(403, "No access to this chat")

    msg = Message(
        chat_id=req.chat_id,
        role=req.role,
        content=req.content,
        sources=json.dumps(req.sources) if req.sources else None,
        meta=json.dumps(req.meta) if req.meta else None,
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {"message": "saved", "id": str(msg.id)}


@chat_router.delete("/{chat_id}")
def delete_chat(chat_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
    
    # verify chat belongs to user
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == user.id
    ).first()

    if not chat:
        raise HTTPException(404, "Chat not found or no access")

    # Delete all messages associated with this chat first
    db.query(Message).filter(Message.chat_id == chat_id).delete()
    
    # Delete the chat
    db.delete(chat)
    db.commit()

    return {"message": "Chat deleted successfully", "chat_id": chat_id}
