from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import summarizer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the router with the correct prefix
app.include_router(summarizer.router, prefix="/api/summarize", tags=["summarizer"])