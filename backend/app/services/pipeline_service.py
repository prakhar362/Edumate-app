import os
from fastapi import UploadFile, HTTPException
from app.services import (
    pdf_service,
    chromadb_service,
    gemini_service,
    tts_service,
    cloudinary_services,
    mongodb_service,
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def process_pdf_pipeline(
    user_id: str,
    file: UploadFile,
    name: str | None = None,
) -> dict:

    # -------------------------
    # 1️⃣ Read file in memory
    # -------------------------
    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File exceeds 10MB limit."
        )

    base_id = os.path.splitext(file.filename)[0]
    name = name or file.filename

    # -------------------------
    # 2️⃣ Upload PDF to Cloudinary (bytes)
    # -------------------------
    pdf_url = cloudinary_services.upload_pdf_bytes_to_cloudinary(
        contents,
        file.filename
    )
    print(f"✅ PDF uploaded to Cloudinary: {pdf_url}")

    # -------------------------
    # 3️⃣ Extract chunks + embeddings (from memory)
    # -------------------------
    chunks = pdf_service.extract_chunks_from_bytes(contents)
    embeddings = pdf_service.get_embeddings(chunks)
    print(f"✅ Extracted {len(chunks)} chunks")

    chromadb_service.store_chunks(
        chunks=chunks,
        embeddings=embeddings,
        collection_name=base_id,
    )

    # -------------------------
    # 4️⃣ Fetch combined content
    # -------------------------
    combined = chromadb_service.fetch_combined(base_id)

    # -------------------------
    # 5️⃣ Generate summary
    # -------------------------
    summary = gemini_service.get_summary(combined)
    print("✅ Summary generated")

    # -------------------------
    # 6️⃣ Generate audio in memory
    # -------------------------
    audio_bytes = await tts_service.generate_audio_bytes(summary)
    print("✅ Audio generated in memory")

    audio_url = cloudinary_services.upload_audio_bytes_to_cloudinary(
        audio_bytes,
        f"{base_id}_summary.mp3"
    )
    print(f"✅ Audio uploaded to Cloudinary: {audio_url}")

    # -------------------------
    # 7️⃣ Store summary in MongoDB
    # -------------------------
    summary_id = mongodb_service.store_summary(
        summary_text=summary,
        pdf_filename=file.filename,
        audio_url=audio_url,
        name=name,
        user_id=user_id,
        pdf_url=pdf_url,
    )
    print(f"✅ Summary stored in MongoDB: {summary_id}")

    # -------------------------
    # 8️⃣ Generate quiz (non-blocking safe)
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
    # 9️⃣ Return result
    # -------------------------
    return {
        "summary_id": summary_id,
        "quiz_id": quiz_id,
        "pdf_url": pdf_url,
        "audio_path": audio_url,
    }
