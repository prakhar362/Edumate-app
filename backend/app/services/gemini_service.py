import requests
import json
from app.config import GEMINI_API_KEY

def get_summary(text: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
    prompt = f"""
    Summarize the following technical content into 4–6 bullet points or short paragraphs:

    {text}
    """

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"} 

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        return res.json()['candidates'][0]['content']['parts'][0]['text'].strip()
    else:
        raise Exception(f"Gemini API failed (summary): {res.text}")


def get_quiz(text: str) -> list:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    prompt = f"""
    Generate 5 multiple-choice quiz questions based on the following text.

    Return strictly valid JSON in the format:
    [
      {{
        "question": "What is the main idea?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option A"
      }},
      ...
    ]

    Text:
    {text}
    """

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    headers = {"Content-Type": "application/json"}

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        response_data = res.json()
        content_part = response_data['candidates'][0]['content']['parts'][0]
        
        # Handle different response types
        if isinstance(content_part['text'], str):
            quiz_raw = content_part['text'].strip()
            print("🧠 Gemini quiz raw (string):", quiz_raw)
            
            # Check for empty output
            if not quiz_raw or quiz_raw == "[]":
                return get_fallback_quiz("Empty quiz")
            
            # Check if the response is wrapped in Markdown code blocks
            if quiz_raw.startswith("```json") or quiz_raw.startswith("```"):
                # Extract the JSON part from the Markdown code block
                try:
                    # Find the actual JSON content between the code block markers
                    start_idx = quiz_raw.find('[')
                    end_idx = quiz_raw.rfind(']') + 1
                    if start_idx != -1 and end_idx != -1:
                        json_content = quiz_raw[start_idx:end_idx]
                        return json.loads(json_content)
                    else:
                        return get_fallback_quiz("Invalid Markdown JSON format")
                except Exception as e:
                    print(f"⚠️ Markdown JSON parsing error: {e}")
                    return get_fallback_quiz("Invalid Markdown JSON format")
                
            # Regular JSON parsing attempt    
            try:
                return json.loads(quiz_raw)
            except Exception as e:
                print(f"⚠️ JSON parsing error: {e}")
                return get_fallback_quiz("Invalid JSON format")
        elif isinstance(content_part['text'], list):
            # If API directly returns a list, use it
            print("🧠 Gemini quiz raw (list):", content_part['text'])
            return content_part['text']
        else:
            print(f"⚠️ Unexpected content type: {type(content_part['text'])}")
            return get_fallback_quiz("Unexpected response format")
    else:
        raise Exception(f"Gemini Quiz API failed: {res.text}")

# Helper function for fallback quiz
def get_fallback_quiz(reason):
    print(f"⚠️ Generating fallback quiz: {reason}")
    return [{
        "question": "Fallback Question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": "Option A"
    }]
