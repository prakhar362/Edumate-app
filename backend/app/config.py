import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
TENANT_ID = os.getenv("TENANT_ID")
DB_NAME = os.getenv("DB_NAME", "summarizer")
MONGODB_URI = os.getenv("MONGODB_URL")

# Auth / JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
