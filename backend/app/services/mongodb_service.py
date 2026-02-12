from datetime import datetime
import json
import os
from typing import Any, Dict, Optional

from bson import ObjectId
from pymongo import MongoClient

from app.config import MONGODB_URI

# Initialize MongoDB client
client = MongoClient(MONGODB_URI)
db = client["note-summarizer"]


class MongoJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for MongoDB objects."""

    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def convert_mongo_doc(doc: Any):
    """Convert MongoDB document to JSON-serializable format."""
    if doc is None:
        return None

    if isinstance(doc, list):
        return [convert_mongo_doc(item) for item in doc]

    if isinstance(doc, dict):
        return {k: convert_mongo_doc(v) for k, v in doc.items()}

    if isinstance(doc, ObjectId):
        return str(doc)

    if isinstance(doc, datetime):
        return doc.isoformat()

    return doc


# -----------------------
# User helpers
# -----------------------


def create_user(
    name: str,
    email: str,
    password_hash: Optional[str],
    auth_provider: str = "local",
    google_id: Optional[str] = None,
    picture: Optional[str] = None,
) -> str:
    users_collection = db["users"]
    now = datetime.now()
    user_doc: Dict[str, Any] = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "auth_provider": auth_provider,
        "google_id": google_id,
        "picture": picture,
        "created_at": now,
        "updated_at": now,
    }
    result = users_collection.insert_one(user_doc)
    return str(result.inserted_id)


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    users_collection = db["users"]
    user = users_collection.find_one({"email": email})
    return convert_mongo_doc(user)


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    users_collection = db["users"]
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    user = users_collection.find_one({"_id": oid})
    return convert_mongo_doc(user)


def upsert_google_user(
    email: str,
    name: str,
    google_id: str,
    picture: Optional[str] = None,
) -> Dict[str, Any]:
    """Create or update a user authenticated via Google."""
    users_collection = db["users"]
    now = datetime.now()

    existing = users_collection.find_one({"email": email})
    if existing:
        users_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "name": name,
                    "google_id": google_id,
                    "picture": picture,
                    "auth_provider": "google",
                    "updated_at": now,
                }
            },
        )
        existing.update(
            {
                "name": name,
                "google_id": google_id,
                "picture": picture,
                "auth_provider": "google",
            }
        )
        return convert_mongo_doc(existing)

    user_doc: Dict[str, Any] = {
        "name": name,
        "email": email,
        "password_hash": None,
        "auth_provider": "google",
        "google_id": google_id,
        "picture": picture,
        "created_at": now,
        "updated_at": now,
    }
    result = users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return convert_mongo_doc(user_doc)


# -----------------------
# Summary / Quiz helpers
# -----------------------


def store_summary(
    summary_text: str,
    pdf_filename: str,
    audio_url: str,
    name: str,
    user_id: str,
    pdf_url: str,
) -> str:
    """Store summary in MongoDB."""
    summaries_collection = db["summaries"]

    summary_doc = {
        "filename": pdf_filename,
        "base_id": os.path.splitext(os.path.basename(pdf_filename))[0],
        "summary": summary_text,
        "audio_path": audio_url,
        "pdf_url": pdf_url,
        "name": name,
        "user_id": user_id,
        "score": 0,
        "created_at": datetime.now(),
    }

    result = summaries_collection.insert_one(summary_doc)
    return str(result.inserted_id)


def store_quiz(
    quiz_data,
    pdf_filename: str,
    summary_id: str,
    name: str,
    user_id: str,
) -> str:
    """Store quiz in MongoDB."""
    quizzes_collection = db["quizzes"]

    quiz_doc = {
        "filename": pdf_filename,
        "base_id": os.path.splitext(os.path.basename(pdf_filename))[0],
        "summary_id": summary_id,
        "questions": quiz_data,
        "name": name,
        "user_id": user_id,
        "created_at": datetime.now(),
    }

    result = quizzes_collection.insert_one(quiz_doc)
    return str(result.inserted_id)


def get_summaries_for_user(user_id: str):
    """Get all summaries for a specific user."""
    summaries_collection = db["summaries"]
    summaries = (
        summaries_collection.find(
            {"user_id": user_id},
            {
                "summary": 1,
                "filename": 1,
                "audio_path": 1,
                "pdf_url": 1,
                "created_at": 1,
                "_id": 1,
                "name": 1,
                "score": 1,
                "user_id": 1,
            },
        )
        .sort("created_at", -1)
    )
    return convert_mongo_doc(list(summaries))


def get_summary_for_user(summary_id: str, user_id: str):
    """Get a single summary document for a user."""
    summaries_collection = db["summaries"]
    try:
        oid = ObjectId(summary_id)
    except Exception:
        return None

    summary = summaries_collection.find_one(
        {"_id": oid, "user_id": user_id},
        {
            "summary": 1,
            "audio_path": 1,
            "pdf_url": 1,
            "_id": 1,
            "name": 1,
            "user_id": 1,
        },
    )
    return convert_mongo_doc(summary)


def get_quiz_for_user(summary_id: str, user_id: str):
    """Get quiz for a specific summary and user."""
    quizzes_collection = db["quizzes"]
    quiz = quizzes_collection.find_one({"summary_id": summary_id, "user_id": user_id})
    return convert_mongo_doc(quiz)


def update_summary_score_for_user(summary_id: str, user_id: str, score: int):
    """Update score for a summary belonging to a user."""
    summaries_collection = db["summaries"]

    try:
        oid = ObjectId(summary_id)
    except Exception:
        return {"message": "Invalid summary id"}

    result = summaries_collection.update_one(
        {"_id": oid, "user_id": user_id},
        {"$set": {"score": score}},
    )
    if result.modified_count == 0:
        return {"message": "Summary not found for this user or score unchanged"}

    return {"message": "Score changed successfully"}



# -----------------------Playlists -----------------------

def create_playlist(user_id: str, title: str, description: str = "") -> str:
    playlists = db["playlists"]
    now = datetime.utcnow()

    doc = {
        "user_id": user_id,
        "title": title,
        "description": description,
        "created_at": now,
        "updated_at": now,
    }

    result = playlists.insert_one(doc)
    return str(result.inserted_id)


def get_playlists_for_user(user_id: str):
    playlists = db["playlists"]
    docs = playlists.find({"user_id": user_id}).sort("created_at", -1)
    return convert_mongo_doc(list(docs))


def delete_playlist(user_id: str, playlist_id: str):
    playlists = db["playlists"]
    items = db["playlist_items"]

    try:
        oid = ObjectId(playlist_id)
    except Exception:
        return {"message": "Invalid playlist id"}

    playlists.delete_one({"_id": oid, "user_id": user_id})
    items.delete_many({"playlist_id": playlist_id})

    return {"message": "Playlist deleted"}


# -----------------------
# Playlist Items
# -----------------------

def add_item_to_playlist(
    playlist_id: str,
    name: str,
    summary_id: str | None = None,
    quiz_id: str | None = None,
    pdf_url: str | None = None,
    audio_path: str | None = None,
):
    items = db["playlist_items"]

    doc = {
        "playlist_id": playlist_id,
        "name": name,
        "summary_id": summary_id,
        "quiz_id": quiz_id,
        "pdf_url": pdf_url,
        "audio_path": audio_path,
        "created_at": datetime.utcnow(),
    }

    result = items.insert_one(doc)
    return str(result.inserted_id)


def get_playlist_items(playlist_id: str):
    items = db["playlist_items"]
    docs = items.find({"playlist_id": playlist_id}).sort("created_at", 1)
    return convert_mongo_doc(list(docs))


def remove_item_from_playlist(item_id: str):
    items = db["playlist_items"]

    try:
        oid = ObjectId(item_id)
    except Exception:
        return {"message": "Invalid item id"}

    items.delete_one({"_id": oid})
    return {"message": "Item removed"}