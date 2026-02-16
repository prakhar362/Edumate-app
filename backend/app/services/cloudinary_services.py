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


def upload_audio_to_cloudinary(file_path, public_id=None):
    try:
        validate_file_size(file_path)

        response = cloudinary.uploader.upload(
            file_path,
            resource_type="video",
            folder="summaries/audio/",
            public_id=public_id,
            overwrite=True,
        )
        return response.get("secure_url")

    except BadRequest as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Audio upload failed."
        )


def upload_pdf_to_cloudinary(file_path, public_id=None):
    try:
        validate_file_size(file_path)

        response = cloudinary.uploader.upload(
            file_path,
            resource_type="raw",
            folder="summaries/pdfs/",
            public_id=public_id,
            overwrite=True,
        )
        return response.get("secure_url")

    except BadRequest:
        raise HTTPException(
            status_code=400,
            detail="PDF exceeds 10MB Cloudinary limit."
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="PDF upload failed."
        )
