import edge_tts
from io import BytesIO

async def generate_audio_bytes(text: str) -> bytes:
    communicate = edge_tts.Communicate(text, "en-AU-WilliamNeural")

    audio_stream = BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    return audio_stream.getvalue()   # 🔥 RETURN RAW BYTES
