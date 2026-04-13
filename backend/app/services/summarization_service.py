import requests
import os
import json
from app.config import GEMINI_API_KEY

HF_TOKEN = os.environ.get("HF_TOKEN", "")

def get_bart_summary(text: str) -> str:
    """Uses BART-large-cnn for summarization via HF API"""
    url = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    # Text truncation to avoid token limit errors
    truncated_text = text[:3500] 
    payload = {"inputs": truncated_text, "parameters": {"max_length": 200, "min_length": 50}}
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()[0]['summary_text']
    else:
        print(f"BART Summary API failed, falling back... {response.text}")
        return _fallback_summary(text)

def get_knowledge_graph_concepts(text: str) -> list:
    """
    Extracts key concepts, definitions, and relationships (Knowledge Graph approach).
    Mocking an NER / RE process given production constraints, or using Gemini fallback for extraction.
    """
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
        prompt = f"""
        Extract Key Concepts and Definitions from this text to form a Knowledge Graph.
        Return strictly a JSON array of objects with "concept", "definition", and "relationships".
        Text: {text[:2000]}
        """
        response = requests.post(str(url), headers={"Content-Type": "application/json"}, json={"contents": [{"parts": [{"text": prompt}]}]})
        
        if response.status_code == 200:
            res_text = response.json()['candidates'][0]['content']['parts'][0]['text']
            start = res_text.find('[')
            end = res_text.rfind(']') + 1
            if start != -1 and end != -1:
                return json.loads(res_text[start:end])
    except Exception as e:
        print(f"KG Extraction failed: {e}")
        
    return [{"concept": "Core Subject", "definition": "Main topic extracted", "relationships": ["Overview"]}]

def generate_concept_map_and_summary(text: str, user_complexity: str = "medium") -> str:
    """
    Combined seq2seq summarization + KG approach for final output.
    """
    summary = get_bart_summary(text)
    concepts = get_knowledge_graph_concepts(text)
    
    # Format the final output to match "Concept Map + Summary"
    output = f"**Executive Summary (BART-CNN style):**\n{summary}\n\n"
    output += "**Key Concept Map Framework:**\n"
    for c in concepts:
        output += f"- **{c.get('concept', 'N/A')}**: {c.get('definition', 'N/A')}\n"
        
    return output

def _fallback_summary(text):
    return text[:200] + "..."
