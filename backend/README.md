# ⚙️ Edumate Backend

The power behind **Edumate**, this backend provides AI-driven summarization, audio generation, and content management via a high-performance **FastAPI** server.

## 🚀 Core Functionalities

- **AI Summarization**: Extracts text from PDFs and generates concise summaries using **Google Gemini**.
- **Vector Search (RAG)**: Uses **ChromaDB** to store and retrieve document embeddings, enabling the AI to ground its answers in the source material.
- **Audio Generation**: Converts text summaries into high-quality MP3s using **Google Text-to-Speech**.
- **Quiz Generation**: Automatically creates multiple-choice questions from the uploaded content.
- **Content Management**: Stores and organizes summaries, quizzes, and playlists in **MongoDB**.
- **Authentication**: Custom JWT-based authentication system with support for Google OAuth.

## 🏗️ Architecture

The backend follows a service-oriented pattern:

- **FastAPI**: The core web framework handling routing and middleware.
- **Pydantic**: Data validation and serialization.
- **Services Layer**:
  - `gemini_service.py`: Interfaces with Google Gemini API.
  - `mongodb_service.py`: Handles all MongoDB operations.
  - `chromadb_service.py`: Manages vector embeddings and similarity search.
  - `cloudinary_services.py`: Manages file uploads to Cloudinary.
  - `tts_service.py`: Handles Text-to-Speech conversion.
  - `pdf_service.py`: Manages PDF data extraction and chunking.

## 🛠️ Tech Stack

- **Languge**: Python 3.10+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Vector DB**: [ChromaDB](https://www.trychroma.com/)
- **AI**: [Google Gemini Pro](https://ai.google.dev/)
- **Storage**: [Cloudinary](https://cloudinary.com/)
- **Cache**: [Redis](https://redis.io/)

## 📂 Project Structure

```bash
backend/
├── app/
│   ├── auth/           # Security and JWT dependencies
│   ├── db/             # Database initialization
│   ├── models/         # Pydantic schemas and database models
│   ├── routes/         # API endpoints (auth, summarizer, playlists)
│   ├── services/       # Core business logic and integrations
│   └── utils/          # Helper functions
├── audio/              # Local temporary audio storage
├── uploads/            # Local temporary PDF storage
└── main.py             # Entry point
```

## 🏗️ Setup & Development

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Environment Variables**:
   Create a `.env` file with the following keys:
   ```env
   MONGODB_URI=...
   GEMINI_API_KEY=...
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   JWT_SECRET=...
   GOOGLE_CLIENT_ID=...
   ```
3. **Run Server**:
   ```bash
   uvicorn main:app --reload
   ```

## 📄 API Documentation

Once the server is running, you can access the interactive API docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
