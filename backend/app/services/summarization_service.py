import requests
import os
import json
from app.config import GEMINI_API_KEY

HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_SPACE_URL = os.environ.get("HF_SPACE_URL", "") # Custom HF Space URL (e.g. https://your-space.hf.space)
BART_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

def get_technical_summary(text: str) -> str:
    """
    Uses a 3-tier Resilient Fallback Framework:
    Tier 1: Hugging Face Serverless Inference API (BART-large-cnn)
    Tier 2: Custom Hosted Hugging Face Space Endpoint (BART-large-cnn)
    Tier 3: Google Gemini 2.5 Flash Lite API
    """
    # 1️⃣ TIER 1: Hugging Face Serverless Inference API
    try:
        print("🚀 [Tier 1] Invoking Hugging Face Serverless Inference API for facebook/bart-large-cnn...")
        headers = {}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"
        headers["Content-Type"] = "application/json"
        
        truncated_text = text[:4000] # Safe token limit
        payload = {
            "inputs": truncated_text,
            "parameters": {
                "max_length": 150,
                "min_length": 40,
                "do_sample": False
            }
        }
        
        response = requests.post(BART_API_URL, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            res_json = response.json()
            if isinstance(res_json, list) and len(res_json) > 0 and 'summary_text' in res_json[0]:
                print("✅ [Tier 1] Successfully generated summary via Serverless BART HF Inference!")
                return res_json[0]['summary_text'].strip()
        print(f"⚠️ [Tier 1] Failed (Status {response.status_code})")
    except Exception as e:
        print(f"⚠️ [Tier 1] Exception: {e}")

    # 2️⃣ TIER 2: Custom Hosted Hugging Face Space Endpoint
    if HF_SPACE_URL:
        try:
            print(f"🚀 [Tier 2] Invoking Custom Hosted Hugging Face Space at {HF_SPACE_URL}/summarize...")
            space_endpoint = f"{HF_SPACE_URL.rstrip('/')}/summarize"
            payload = {"text": text[:6000]} # Spaces usually have higher capacity
            headers = {"Content-Type": "application/json"}
            
            response = requests.post(space_endpoint, headers=headers, json=payload, timeout=90)
            if response.status_code == 200:
                res_json = response.json()
                summary = res_json.get("summary") or res_json.get("summary_text")
                if summary:
                    print("✅ [Tier 2] Successfully generated summary via Custom Hosted HF Space!")
                    return summary.strip()
            print(f"⚠️ [Tier 2] Space endpoint returned code {response.status_code}")
        except Exception as e:
            print(f"⚠️ [Tier 2] Custom Space Exception: {e}")
    else:
        print("ℹ️ [Tier 2] Skipped (HF_SPACE_URL environment variable is not configured)")

    # 3️⃣ TIER 3: Google Gemini 2.5 Flash Lite API Fallback
    print("🧠 [Tier 3] Falling back to Google Gemini 2.5 Flash Lite for high-quality summarization...")
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
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        print(f"⚠️ [Tier 3] Gemini Summary Generation Error: {e}")
        
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
