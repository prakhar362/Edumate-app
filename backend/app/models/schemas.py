from pydantic import BaseModel
from typing import List, Optional, Union

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    summary_id: Optional[str] = None

class SummarizeResponse(BaseModel):
    name: str
    score: int
    summary: str
    audio_path: str
    quiz: List[QuizQuestion]
    summary_id: Optional[str] = None
    quiz_id: Optional[str] = None
