from app.db.connection import Base, engine
from app.auth.models import User
from app.db.models import Document, Chunk
from app.chat.models import Chat, Message
from app.sql.models import UploadedTable


def init_db():
    Base.metadata.create_all(bind=engine)
