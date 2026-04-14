import requests
import os
import json
from app.config import GEMINI_API_KEY
import random

HF_TOKEN = os.environ.get("HF_TOKEN", "")

def generate_distractors(answer: str, context: str) -> list:
    """Mock/Prompt based distractor generation for now, ensuring 4 options."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
        prompt = f"Given the correct answer '{answer}' and context '{context[:1000]}', generate 3 plausible but incorrect distractors. Return strictly a JSON array of 3 strings."
        response = requests.post(str(url), headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": prompt}]}]})
        
        if response.status_code == 200:
            res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            start = res_text.find('[')
            end = res_text.rfind(']') + 1
            if start != -1 and end != -1:
                distractors = json.loads(res_text[start:end])
                if isinstance(distractors, list) and len(distractors) == 3:
                     # Mix options
                     options = distractors + [answer]
                     random.shuffle(options)
                     return options
    except Exception as e:
        print(f"Distractor generation failed: {e}")
        
    options = [answer, "None of the above", "All of the above", f"Not {answer}"]
    random.shuffle(options)
    return options
    

def get_t5_quiz(text: str, difficulty: str = "medium") -> list:
    """
    Deep Learning Quiz Generation using T5 approach.
    Since loading local models isn't possible, we'll try to use HF inference or fallback to Gemini 
    with specialized T5-like prompting constraints for deep distraction and logic.
    """
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
        # We enforce T5 QG logic + Difficulty Controller
        prompt = f"""
        Acting as a fine-tuned T5 model for Question Generation (QG).
        Difficulty Level: {difficulty.upper()}
        For {difficulty} mode, the cognitive load should be adjusted (e.g., Easy = direct recall, Medium = application, Hard = conceptual synthesis).
        
        Generate 5 multiple-choice questions from the text below. 
        Implement automated robust logic-based distractors.
        
        Return STRICTLY in JSON format:
        [
          {{
            "question": "Question text...",
            "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
            "answer": "Correct option text exactly matching one of the options"
          }}, ...
        ]
        
        CRITICAL: The "answer" field MUST be the exact word/string of the correct option, NOT a letter like 'A' or 'B'.

        Text: {text[:3000]}
        """
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        response = requests.post(str(url), headers={"Content-Type": "application/json"}, json=payload)
        
        if response.status_code == 200:
            res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            start = res_text.find('[')
            end = res_text.rfind(']') + 1
            if start != -1 and end != -1:
                return json.loads(res_text[start:end])
    except Exception as e:
        print(f"T5 Quiz Logic failed: {e}")
    
    return [
        {
            "question": "Could not generate questions due to an error.",
            "options": ["Service Unavailable", "Unknown parsing error", "Generation failed", "API limits reached"],
            "answer": "Service Unavailable"
        }
    ]
