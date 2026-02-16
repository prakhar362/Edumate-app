import os
import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import BadRequest
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file_size(file_path):
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 10MB limit. Please upload a smaller file."
        )

from io import BytesIO

def upload_pdf_bytes_to_cloudinary(file_bytes, filename, public_id=None):
    try:
        response = cloudinary.uploader.upload(
            BytesIO(file_bytes),
            resource_type="raw",
            folder="summaries/pdfs/",
            public_id=public_id,
            overwrite=True,
        )
        return response["secure_url"]

    except BadRequest:
        raise HTTPException(status_code=400, detail="PDF exceeds 10MB limit.")

    except Exception:
        raise HTTPException(status_code=500, detail="PDF upload failed.")

from io import BytesIO

def upload_audio_bytes_to_cloudinary(audio_bytes: bytes, filename: str):
    try:
        file_like = BytesIO(audio_bytes)
        file_like.name = filename   # 🔥 REQUIRED

        response = cloudinary.uploader.upload(
            file_like,
            resource_type="video",
            folder="summaries/audio/",
            overwrite=True,
            format="mp3",
        )

        return response["secure_url"]

    except Exception as e:
        print("🔥 CLOUDINARY AUDIO ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
