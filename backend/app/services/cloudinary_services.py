import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_audio_to_cloudinary(file_path, public_id=None):
    response = cloudinary.uploader.upload(
        file_path,
        resource_type="video",  # needed for audio/video files
        folder="summaries/audio/",
        public_id=public_id,
        overwrite=True
    )
    return response.get("secure_url")
