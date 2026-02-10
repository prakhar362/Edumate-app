import edge_tts

async def generate_audio(text, output_filename):
    communicate = edge_tts.Communicate(text, "en-AU-WilliamNeural")
    await communicate.save(output_filename)
