from fastapi import APIRouter, UploadFile, File, Form
from app.services import pdf_service, gemini_service, chromadb_service, tts_service, mongodb_service
from app.models.schemas import SummarizeResponse, QuizQuestion
from app.services.cloudinary_services import upload_audio_to_cloudinary

import os

# Make sure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("audio", exist_ok=True)

router = APIRouter()

@router.post("/pdf", response_model=SummarizeResponse)
async def summarize_pdf(file: UploadFile = File(...), name: str = Form(...)):
    # Save uploaded file locally
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Base ID without extension
    base_id = os.path.splitext(file.filename)[0]

    # Extract chunks and embeddings
    chunks = pdf_service.extract_chunks(file_path)
    embeddings = pdf_service.get_embeddings(chunks)

    # Store in ChromaDB
    chromadb_service.store_chunks(chunks, embeddings, base_id)

    # Fetch combined content
    combined = chromadb_service.fetch_combined(base_id)

    # Generate summary
    summary = gemini_service.get_summary(combined)

    # Store summary in ChromaDB
    chromadb_service.store_summary(summary, collection_name=f"{base_id}_summary", pdf_filename=file.filename)

    # Generate audio locally first
    audio_path = f"audio/{base_id}_summary.mp3"
    await tts_service.generate_audio(summary, audio_path)

    # Upload to Cloudinary
    cloudinary_url = upload_audio_to_cloudinary(audio_path)

    # Store Cloudinary URL in MongoDB
    summary_id = mongodb_service.store_summary(summary, file.filename, cloudinary_url, name)

    # Generate quiz
    try:
        quiz_data = gemini_service.get_quiz(combined)
        print("📘 Combined input for quiz:", combined[:500])
        print("🧠 Raw quiz:", quiz_data)

        # quiz_data is already a list of dictionaries
        quiz = [QuizQuestion(**q) for q in quiz_data]
        
        # Store quiz in MongoDB
        quiz_id = mongodb_service.store_quiz(quiz_data, file.filename, summary_id, name) #send name
        
    except Exception as e:
        print("⚠️ Quiz generation failed:", e)
        quiz = []
        quiz_id = None

    return SummarizeResponse(
        name=name,
        score=0,
        summary=summary,
        audio_path=audio_path,
        quiz=quiz,
        summary_id=summary_id,
        quiz_id=quiz_id
    )

@router.get("/summaries")
async def get_summaries():
    """Get all summaries"""
    return mongodb_service.get_summaries()

@router.get("/summaries/{summary_id}")
async def get_summaries(summary_id: str):
    """Get summary by ID"""
    return mongodb_service.get_summaries_by_id(summary_id)

@router.get("/quiz/{summary_id}")
async def get_quiz(summary_id: str):
    """Get quiz for a specific summary"""
    return mongodb_service.get_quiz_by_summary_id(summary_id)

@router.post("/quiz/submit/{summary_id}")
async def get_quiz(summary_id: str, score: int = Form(...)):
    """Get quiz for a specific summary"""
    return mongodb_service.get_quiz_submit_summary_id(summary_id,score)