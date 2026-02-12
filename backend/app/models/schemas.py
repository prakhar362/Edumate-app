from typing import List, Optional,Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, model_validator


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

class PlaylistCreate(BaseModel):
    title: str
    description: Optional[str] = None


class PlaylistOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    total_items: int
    created_at: datetime

from typing import Optional
from pydantic import BaseModel

class PlaylistItemCreate(BaseModel):
    name: str

    # primary content
    summary_id: Optional[str] = None

    # attachments generated from summary
    quiz_id: Optional[str] = None
    pdf_url: Optional[str] = None
    audio_path: Optional[str] = None