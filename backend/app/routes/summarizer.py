import os

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.auth.deps import get_current_user
from app.models.schemas import QuizQuestion, SummarizeResponse
from app.services import chromadb_service, gemini_service, mongodb_service, pdf_service, tts_service
from app.services.cloudinary_services import (
    upload_audio_to_cloudinary,
    upload_pdf_to_cloudinary,
)

# Make sure directories exist for temporary files
os.makedirs("uploads", exist_ok=True)
os.makedirs("audio", exist_ok=True)

router = APIRouter()


@router.post("/pdf", response_model=SummarizeResponse)
async def summarize_pdf(
    file: UploadFile = File(...),
    name: str = Form(...),
    current_user=Depends(get_current_user),
):
    # Save uploaded file locally (temporary)
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Upload PDF to Cloudinary
    pdf_url = upload_pdf_to_cloudinary(file_path)

    # Base ID without extension
    base_id = os.path.splitext(file.filename)[0]

    # Extract chunks and embeddings (from local temp file)
    chunks = pdf_service.extract_chunks(file_path)
    embeddings = pdf_service.get_embeddings(chunks)

    # Store in ChromaDB
    chromadb_service.store_chunks(chunks, embeddings, base_id)

    # Fetch combined content
    combined = chromadb_service.fetch_combined(base_id)

    # Generate summary
    summary = gemini_service.get_summary(combined)

    # Store summary in ChromaDB
    chromadb_service.store_summary(
        summary, collection_name=f"{base_id}_summary", pdf_filename=file.filename
    )

    # Generate audio locally first
    audio_path = f"audio/{base_id}_summary.mp3"
    await tts_service.generate_audio(summary, audio_path)

    # Upload audio to Cloudinary
    audio_url = upload_audio_to_cloudinary(audio_path)

    user_id = str(current_user["id"])

    # Store summary with Cloudinary URLs in MongoDB
    summary_id = mongodb_service.store_summary(
        summary_text=summary,
        pdf_filename=file.filename,
        audio_url=audio_url,
        name=name,
        user_id=user_id,
        pdf_url=pdf_url,
    )

    # Generate quiz
    try:
        quiz_data = gemini_service.get_quiz(combined)

        # quiz_data is already a list of dictionaries
        quiz = [QuizQuestion(**q) for q in quiz_data]

        # Store quiz in MongoDB
        quiz_id = mongodb_service.store_quiz(
            quiz_data, file.filename, summary_id, name, user_id
        )

    except Exception as e:
        print("⚠️ Quiz generation failed:", e)
        quiz = []
        quiz_id = None

    # Optionally clean up local files
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
    except Exception:
        # Non-fatal if cleanup fails
        pass

    return SummarizeResponse(
        name=name,
        score=0,
        summary=summary,
        audio_path=audio_url,
        quiz=quiz,
        summary_id=summary_id,
        quiz_id=quiz_id,
        pdf_url=pdf_url,
    )


@router.get("/summaries")
async def get_summaries(current_user=Depends(get_current_user)):
    """Get all summaries for the current user."""
    return mongodb_service.get_summaries_for_user(str(current_user["id"]))


@router.get("/summaries/{summary_id}")
async def get_summary(summary_id: str, current_user=Depends(get_current_user)):
    """Get a single summary by ID for the current user."""
    return mongodb_service.get_summary_for_user(summary_id, str(current_user["id"]))


@router.get("/quiz/{summary_id}")
async def get_quiz(summary_id: str, current_user=Depends(get_current_user)):
    """Get quiz for a specific summary belonging to the current user."""
    return mongodb_service.get_quiz_for_user(summary_id, str(current_user["id"]))


@router.post("/quiz/submit/{summary_id}")
async def submit_quiz_score(
    summary_id: str,
    score: int = Form(...),
    current_user=Depends(get_current_user),
):
    """Submit a score for a summary's quiz for the current user."""
    return mongodb_service.update_summary_score_for_user(
        summary_id, str(current_user["id"]), score
    )
