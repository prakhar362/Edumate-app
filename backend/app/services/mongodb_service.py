from pymongo import MongoClient
from bson import ObjectId
from app.config import MONGODB_URI
from datetime import datetime
import os
import json

# Initialize MongoDB client
client = MongoClient(MONGODB_URI)
db = client["notes_summarizer"]

# Custom JSON encoder for MongoDB objects
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def convert_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
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

def store_summary(summary_text, pdf_filename, audio_path, name):
    """Store summary in MongoDB"""
    summaries_collection = db["summaries"]
    
    # Create summary document
    summary_doc = {
        "filename": pdf_filename,
        "base_id": os.path.splitext(os.path.basename(pdf_filename))[0],
        "summary": summary_text,
        "audio_path": audio_path,
        "name": name,
        "score":0,
        "created_at": datetime.now()
    }
    
    # Insert document and return ID
    result = summaries_collection.insert_one(summary_doc)
    return str(result.inserted_id)

def store_quiz(quiz_data, pdf_filename, summary_id, name):
    """Store quiz in MongoDB"""
    quizzes_collection = db["quizzes"]
    
    # Create quiz document
    quiz_doc = {
        "filename": pdf_filename,
        "base_id": os.path.splitext(os.path.basename(pdf_filename))[0],
        "summary_id": summary_id,
        "questions": quiz_data,
        "name": name,
        "created_at": datetime.now()
    }
    
    # Insert document and return ID
    result = quizzes_collection.insert_one(quiz_doc)
    return str(result.inserted_id)

def get_summaries():
    """Get all summaries"""
    summaries_collection = db["summaries"]
    summaries = list(summaries_collection.find({}, {"summary": 1, "filename": 1, "audio_path": 1, "created_at": 1, "_id": 1,"name" : 1, "score":1})
                .sort("created_at", -1))
    
    # Convert ObjectId to string
    return convert_mongo_doc(summaries)

def get_summaries_by_id(summary_id: str):
    """Get summary, name, audio_path, _id by ID"""
    summaries_collection = db["summaries"]
    summaries = list(
        summaries_collection.find(
            {"_id": ObjectId(summary_id)},
            {"summary": 1, "audio_path": 1, "_id": 1, "name": 1}
        ).sort("created_at", -1)
    )
    return convert_mongo_doc(summaries)

def get_quiz_by_summary_id(summary_id):
    """Get quiz for a specific summary"""
    quizzes_collection = db["quizzes"]
    quiz = quizzes_collection.find_one({"summary_id": summary_id})
    
    # Convert ObjectId to string
    return convert_mongo_doc(quiz)

def get_quiz_submit_summary_id(summary_id, score):
    """Update score for a quiz with a specific summary_id"""
    quizzes_collection = db["summaries"]

    result = quizzes_collection.update_one(
        {"_id":  ObjectId(summary_id)},
        {"$set": {"score": score}}
    )
    if result.modified_count == 0:
        return {"message": "Quiz not found or score unchanged"}

    
    return {"message": "Score changed successfully"}

