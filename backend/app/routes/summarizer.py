import os
import re
from io import BytesIO
from fastapi import APIRouter, Depends, File, Form, UploadFile,HTTPException

from app.auth.deps import get_current_user
from app.models.schemas import QuizQuestion, SummarizeResponse
from app.services import chromadb_service, gemini_service, mongodb_service, pdf_service, tts_service
from app.services.cloudinary_services import (
    upload_audio_bytes_to_cloudinary,
    upload_pdf_bytes_to_cloudinary,
)

# Make sure directories exist for temporary files
os.makedirs("uploads", exist_ok=True)
os.makedirs("audio", exist_ok=True)

router = APIRouter()
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/pdf", response_model=SummarizeResponse)
async def summarize_pdf(
    file: UploadFile = File(...),
    name: str = Form(...),
    current_user=Depends(get_current_user),
):
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")

    # -------- Upload PDF directly from memory --------
    pdf_url = upload_pdf_bytes_to_cloudinary(contents, file.filename)
    print(f"PDF uploaded to Cloudinary: {pdf_url}")

    base_id = os.path.splitext(file.filename)[0]

    # -------- Extract PDF text from memory --------
    print("📑 [Pipeline] Step 1: Extracting hierarchical chunks from PDF...")
    chunks = pdf_service.extract_chunks_from_bytes(contents)
    print(f"📑 [Pipeline] Extracted {len(chunks)} chunks from PDF.")

    print("🔢 [Pipeline] Step 2: Generating embeddings via HuggingFace...")
    embeddings = pdf_service.get_embeddings(chunks)
    print(f"🔢 [Pipeline] Generated {len(embeddings)} embeddings (dim={len(embeddings[0]) if embeddings else 'N/A'}).")

    print("💾 [Pipeline] Step 3: Storing chunks in ChromaDB...")
    chromadb_service.store_chunks(chunks, embeddings, base_id)

    print("🔎 [Pipeline] Step 4: Fetching and re-ranking combined context...")
    combined = chromadb_service.fetch_combined(base_id)
    print(f"🔎 [Pipeline] Combined context ready: {len(combined)} chars.")

    print("🧠 [Pipeline] Step 5: Generating summary via Gemini...")
    summary = gemini_service.get_summary(combined)
    # Remove bold (**text**)
    summary = re.sub(r"\*\*(.*?)\*\*", r"\1", summary)
    # Remove bullet markers (*   or - )
    summary = re.sub(r"^\s*[\*\-]\s+", "", summary, flags=re.MULTILINE)
    # Remove extra backticks
    summary = re.sub(r"`+", "", summary)
    # Remove multiple spaces
    summary = re.sub(r"\n\s*\n", "\n\n", summary)
    summary = summary.strip()
    print(f"✅ [Pipeline] Summary generated and cleaned. Final length: {len(summary)} chars.")

    print("💾 [Pipeline] Step 6: Storing summary in ChromaDB...")
    chromadb_service.store_summary(
        summary,
        collection_name=f"{base_id}_summary",
        pdf_filename=file.filename,
    )
    print(f"✅ [Pipeline] Summary stored in ChromaDB collection: '{base_id}_summary'.")

    # -------- Generate audio in memory --------
    print("🔊 [Pipeline] Step 7: Generating TTS audio from summary...")
    audio_bytes = await tts_service.generate_audio_bytes(summary)
    print("✅ [Pipeline] Audio generated from summary.")

    audio_url = upload_audio_bytes_to_cloudinary(
        audio_bytes,
        f"{base_id}_summary.mp3"
    )
    print(f"☁️ [Pipeline] Audio uploaded to Cloudinary: {audio_url}")

    user_id = str(current_user["id"])

    print("💾 [Pipeline] Step 8: Storing summary metadata in MongoDB...")
    summary_id = mongodb_service.store_summary(
        summary_text=summary,
        pdf_filename=file.filename,
        audio_url=audio_url,
        name=name,
        user_id=user_id,
        pdf_url=pdf_url,
    )
    print(f"✅ [Pipeline] Summary stored in MongoDB with ID: {summary_id}")

     # Generate quiz
    print("🧩 [Pipeline] Step 9: Generating quiz questions...")
    try:
        quiz_data = gemini_service.get_quiz(combined)
        print(f"✅ [Pipeline] Quiz generated: {len(quiz_data)} questions.")

        # quiz_data is already a list of dictionaries
        quiz = [QuizQuestion(**q) for q in quiz_data]

        # Store quiz in MongoDB
        quiz_id = mongodb_service.store_quiz(
            quiz_data, file.filename, summary_id, name, user_id
        )
        print(f"✅ [Pipeline] Quiz stored in MongoDB with ID: {quiz_id}")

    except Exception as e:
        print(f"⚠️ Quiz generation failed: {e}")
        quiz = []
        quiz_id = None

    print(f"🎉 [Pipeline] Complete! summary_id={summary_id}, quiz_id={quiz_id}")


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

@router.get("/summary/score")
async def get_summary_scores(current_user=Depends(get_current_user)):
    """
    Get scores of all summaries for the current user.
    Returns summary_id, name, score, created_at.
    """
    user_id = str(current_user["id"])
    return mongodb_service.get_summary_scores_for_user(user_id)
