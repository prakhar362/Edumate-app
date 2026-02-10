from typing import List, Optional

from pydantic import BaseModel, EmailStr


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    summary_id: Optional[str] = None


class SummarizeResponse(BaseModel):
    name: str
    score: int
    summary: str
    audio_path: str  # Cloudinary URL
    quiz: List[QuizQuestion]
    summary_id: Optional[str] = None
    quiz_id: Optional[str] = None
    pdf_url: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthIn(BaseModel):
    id_token: str


class UserOut(UserBase):
    id: str
    auth_provider: str
    picture: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
