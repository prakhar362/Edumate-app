import edge_tts
from io import BytesIO
import configparser

# Keep relative import for compatibility
try:
    from app.services.adaptive_engine import get_adaptive_tts_speed
except ImportError:
    def get_adaptive_tts_speed(*args, **kwargs): return "+0%"

async def generate_audio_bytes(text: str, user_id: str = "default_user") -> bytes:
    # Use Adaptive Engine for speed based on difficulty
    rate = get_adaptive_tts_speed(user_id)
    
    # Emotion-aware / Domain-aware voice selection
    text_lower = text.lower()
    if any(keyword in text_lower for keyword in ["quantum", "medical", "algorithm", "architecture", "analysis"]):
        voice = "en-US-ChristopherNeural" # More authoritative/serious for hard subjects
    elif any(keyword in text_lower for keyword in ["welcome", "congratulations", "fun"]):
        voice = "en-US-AriaNeural" # Upbeat/positive
    else:
        voice = "en-AU-WilliamNeural" # Default conversational
        
    communicate = edge_tts.Communicate(text, voice, rate=rate)

    audio_stream = BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    return audio_stream.getvalue()   # 🔥 RETURN RAW BYTES
