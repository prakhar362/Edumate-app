from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, summarizer,playlists
from app.services.redis_service import redis_client

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Summarizer routes (protected)
app.include_router(summarizer.router, prefix="/api/summarize", tags=["summarizer"])

app.include_router(playlists.router, prefix="/api/playlists",  tags=["playlists"])

@app.get("/")
async def root():
    return {"message": "Edumate Backend is Running 🚀"}

@app.get("/test-redis")
def test_redis():
    redis_client.set("test_key", "hello_redis", ex=60)
    return {"value": redis_client.get("test_key")}