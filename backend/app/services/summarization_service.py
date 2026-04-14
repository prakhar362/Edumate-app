import requests
import os
import json
from app.config import GEMINI_API_KEY

HF_TOKEN = os.environ.get("HF_TOKEN", "")

def get_technical_summary(text: str) -> str:
    """Uses Gemini for high-quality technical summarization instead of BART."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
        prompt = f"""
        Summarize the following content into 10-20 bullet points or short paragraphs. Do not use conversational openings like "Here's a summary...".
        IMPORTANT: Your output MUST NOT contain ANY asterisks (*). Do not use "**" for bold text. Do not use "*" for bullet points.
        Use normal dashes (-) for list items. 
        Focus strictly on the provided content abstractions:

        {text}
        """
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"Content-Type": "application/json"} 
        
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text'].strip()
        else:
            print(f"Gemini Summary API failed, falling back... {response.text}")
    except Exception as e:
        print(f"Summary Generation Error: {e}")
        
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
        Text: {text}
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
    summary = get_technical_summary(text)
    concepts = get_knowledge_graph_concepts(text)
    
    # Strip out any residual asterisks the LLM generates just in case
    summary = summary.replace("*", "")
    
    # Format the final output to match "Concept Map + Summary" cleanly
    output = f"Executive Summary:\n{summary}\n\n"
    output += "Key Concept Map Framework:\n"
    for c in concepts:
        concept_name = c.get('concept', 'N/A').replace("*", "")
        concept_def = c.get('definition', 'N/A').replace("*", "")
        output += f"- {concept_name}: {concept_def}\n"
        
    return output

def _fallback_summary(text):
    return text[:200] + "..."
