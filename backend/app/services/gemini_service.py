import requests
import json
from app.config import GEMINI_API_KEY
from app.services.summarization_service import generate_concept_map_and_summary
from app.services.quiz_generation_service import get_t5_quiz
from app.services.adaptive_engine import calculate_evaluation_metrics, update_feedback_loop

def get_summary(text: str) -> str:
    """
    Routes to the Advanced Summarization & Knowledge Extraction service (Seq2Seq + KG).
    Returns Concept Map + Summary output.
    """
    print("🧠 Using Advanced Seq2Seq + KG Pipeline for Summarization...")
    summary = generate_concept_map_and_summary(text)
    
    # 5. Audio & Evaluation Intelligence: Metrics Layer
    metrics = calculate_evaluation_metrics(summary, text)
    print(f"📊 Evaluation Intelligence Metrics: {metrics}")
    
    return summary


def get_quiz(text: str) -> list:
    """
    Routes to the Deep Learning Quiz Generation service (T5 model logic with Distractors).
    """
    print("🧠 Using Deep Learning T5 logic for Quiz Generation...")
    return get_t5_quiz(text)

# We keep the old fallback for compatibility just in case
def get_fallback_quiz(reason):
    print(f"⚠️ Generating fallback quiz: {reason}")
    return [{
        "question": "Fallback Question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option A"
    }]
