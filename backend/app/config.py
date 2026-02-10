import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_API_KEY = os.getenv("CHROMA_API_KEY")
TENANT_ID = os.getenv("TENANT_ID")
DB_NAME = os.getenv("DB_NAME", "summarizer")
MONGODB_URI = os.getenv("MONGODB_URL")
