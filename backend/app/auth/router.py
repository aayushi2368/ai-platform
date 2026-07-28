from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import SessionLocal
from app.auth.models import User
from app.auth.schemas import RegisterRequest
from app.auth.security import hash_password
from app.auth.security import verify_password
from app.auth.jwt import create_access_token
from pydantic import BaseModel, EmailStr
from app.auth.deps import get_current_user



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




auth_router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@auth_router.post("/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):

    # 1) check if user already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")

    # 2) hash password
    pw_hash = hash_password(payload.password)

    # 3) create user
    new_user = User(email=payload.email, password_hash=pw_hash)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4) respond (never return password hash)
    return {
        "message": "User registered successfully",
        "user_id": str(new_user.id),
        "email": new_user.email
    }


@auth_router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):

    # 1) find user
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(400, "Invalid email or password")

    # 2) verify password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(400, "Invalid email or password")

    # 3) create JWT token
    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email
        }
    }

@auth_router.get("/me")
def get_me(user = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "email": user.email
    }