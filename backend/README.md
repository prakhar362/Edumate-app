# ⚙️ Edumate Backend

The power behind **Edumate**, this backend provides AI-driven summarization, audio generation, and content management via a high-performance **FastAPI** server.

## 🚀 Core Functionalities

- **Advanced AI Summarization**: Extracts text from PDFs and generates concise summaries natively using **Seq2Seq Hugging Face pipelines (BART-large-cnn)** paired with a Knowledge Graph Concept Mapping layer.
- **Intelligent RAG Architecture**: Uses **ChromaDB** with Hierarchical Section Chunking and a **Cross-Encoder Re-Ranking model (MS-Marco)** bridging source retrieval logic dynamically before summary generation.
- **Adaptive Learning Engine**: Implements an Epsilon-greedy **Bandits RL loop** referencing user score history via **MongoDB Tracking**. Actively modulates content difficulty, quiz complexity, and pacing on the fly.
- **Deep Learning Quiz Generation**: Specifically utilizes customized **T5-tuned logic parameters** paired with Automated Logic-based Distractor generation to assemble dynamic MCQs.
- **Emotion-Aware Audio Generation**: Converts summaries into MP3s using **Google Text-to-Speech** coupled with semantic keyword triggers adapting narration emotion (voice mapping), and pacing via the Adaptive Engine.
- **Content Management**: Stores and organizes summaries, quizzes, user embeddings, and playlists natively in **MongoDB**.

## 🏗️ Architecture

The backend follows a highly decoupled and modular production service pattern:

- **FastAPI**: The core web framework proxying routing cleanly.
- **Services Layer**:
  - `summarization_service.py`: Seq2Seq BART + Concept extraction architectures.
  - `quiz_generation_service.py`: T5 generation logic mimicking Distractor and Difficulty constraints.
  - `adaptive_engine.py`: Reinforcement Learning tracker for user states scaling text complexity dynamically.
  - `gemini_service.py`: Acts structurally as the main proxy routing payload across the RL systems.
  - `chromadb_service.py`: Manages vector embeddings, retrieval, and Cross-Encoder re-ranking.
  - `mongodb_service.py`: Handles structural metadata, DB hooks into RL systems, and playlist mappings.
  - `tts_service.py`: Handles Emotion-aware edge Text-to-Speech processing.
  - `pdf_service.py`: Hierarchical chunks targeting and Cross Encoder verification logic.

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
