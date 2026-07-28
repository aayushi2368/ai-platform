from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.db.connection import Base
from pgvector.sqlalchemy import Vector   # ✅ Correct import


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"))
    text = Column(Text, nullable=False)

    embedding = Column(Vector (384))      # size of Nomic embeddings

    chunk_index = Column(Integer, nullable=False)
