import os
from fastapi import UploadFile
from app.services import (
    pdf_service,
    chromadb_service,
    gemini_service,
    tts_service,
    cloudinary_services,
    mongodb_service,
)

UPLOAD_DIR = "uploads"
AUDIO_DIR = "audio"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


async def process_pdf_pipeline(
    user_id: str,
    file: UploadFile,
    name: str | None = None,
) -> dict:
    # -------------------------
    # 1️. Save PDF locally
    # -------------------------
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    base_id = os.path.splitext(file.filename)[0]
    name = name or file.filename

    # -------------------------
    # 2️. Upload PDF to Cloudinary
    # -------------------------
    pdf_url = cloudinary_services.upload_pdf_to_cloudinary(file_path)

    # -------------------------
    # 3️. Extract chunks + embeddings
    # -------------------------
    chunks = pdf_service.extract_chunks(file_path)
    embeddings = pdf_service.get_embeddings(chunks)

    chromadb_service.store_chunks(
        chunks=chunks,
        embeddings=embeddings,
        collection_name=base_id,
    )

    # -------------------------
    # 4️. Fetch combined content
    # -------------------------
    combined = chromadb_service.fetch_combined(base_id)

    # -------------------------
    # 5️. Generate summary
    # -------------------------
    summary = gemini_service.get_summary(combined)

    # -------------------------
    # 6.Generate audio
    # -------------------------
    local_audio_path = os.path.join(AUDIO_DIR, f"{base_id}_summary.mp3")

    await tts_service.generate_audio(summary, local_audio_path)

    audio_url = cloudinary_services.upload_audio_to_cloudinary(local_audio_path)
    # Store summary in MongoDB
    summary_id = mongodb_service.store_summary(
        summary_text=summary,
        pdf_filename=file.filename,
        audio_url=audio_url,
        name=name,
        user_id=user_id,
        pdf_url=pdf_url,
    )

    # -------------------------
    # 7. Generate quiz (NON-BLOCKING)
    # -------------------------
    quiz_id = None
    try:
        quiz_data = gemini_service.get_quiz(combined)

        quiz_id = mongodb_service.store_quiz(
            quiz_data=quiz_data,
            pdf_filename=file.filename,
            summary_id=summary_id,
            name=name,
            user_id=user_id,
        )

    except Exception as e:
        print("⚠️ Quiz generation failed:", e)

   
    # -------------------------
    # 8️. Cleanup local files
    # -------------------------
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(local_audio_path):
            os.remove(local_audio_path)
    except Exception:
        pass  # non-fatal

    # -------------------------
    # 9️. Return for playlist
    # -------------------------
    return {
        "summary_id": summary_id,
        "quiz_id": quiz_id,
        "pdf_url": pdf_url,
        "audio_path": audio_url,
    }