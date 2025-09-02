from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
from googleapiclient.discovery import build
import google.generativeai as genai

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure the Gemini API
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"CRITICAL ERROR: Failed to configure Gemini API. Check your GEMINI_API_KEY. Error: {e}")

def get_web_context(query):
    """Searches the web and scrapes the top result for context."""
    print(f"--- [BACKEND LOG] Searching web for: '{query}' ---")
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        search_engine_id = os.getenv("SEARCH_ENGINE_ID")
        
        if not api_key or not search_engine_id:
            print("--- [BACKEND LOG] WARNING: Google Search API keys not found. Skipping web search. ---")
            return None

        service = build("customsearch", "v1", developerKey=api_key)
        res = service.cse().list(q=query, cx=search_engine_id, num=1).execute()
        
        if 'items' in res and res['items']:
            top_result = res['items'][0]
            url = top_result['link']
            print(f"--- [BACKEND LOG] Found URL: {url} ---")
            
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
            response = requests.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            for element in soup(["script", "style", "header", "footer", "nav"]):
                element.extract() # Remove irrelevant parts of the page
            
            text = soup.get_text(separator=' ', strip=True)
            print("--- [BACKEND LOG] Successfully scraped web context. ---")
            return text[:4000]
        else:
            print("--- [BACKEND LOG] No web results found. ---")
            return None
    except Exception as e:
        print(f"!!!!!! [BACKEND LOG] ERROR during web search/scrape: {e} !!!!!!")
        return None

@app.route('/api/ask', methods=['POST'])
def ask_assistant():
    print("\n--- [BACKEND LOG] New request received. ---")
    data = request.get_json()
    if not data or 'history' not in data:
        return jsonify({"error": "Invalid request"}), 400

    chat_history = data['history']
    user_question = chat_history[-1]['parts'][0]['text']

    # --- NEW: INTELLIGENT SEARCH TRIGGER ---
    # Only search the web for factual questions, not simple greetings.
    search_keywords = ['what', 'who', 'when', 'where', 'why', 'how', 'specs', 'list', 'explain', 'compare']
    should_search = any(keyword in user_question.lower() for keyword in search_keywords)
    
    web_context = None
    if should_search:
        web_context = get_web_context(user_question)
    else:
        print("--- [BACKEND LOG] Conversational query. Skipping web search. ---")

    # The AI's core persona
    system_prompt = """You are Astro-Assistant, a friendly and expert guide to the universe for amateur stargazers and astrophotographers. Your primary function is to provide accurate, factual information about astronomy and related technology. You must format your responses using standard Markdown. You must NEVER mention that you are an AI."""

    final_prompt = user_question
    if web_context:
        # If we found web context, we create an enhanced prompt
        final_prompt = f"""Using the following up-to-date web context, please provide a comprehensive answer to the user's question.
        
        Web Context:
        ---
        {web_context}
        ---
        
        User's Question: {user_question}"""
    
    # Build the final history for the API call
    api_chat_history = [
        {"role": "user", "parts": [{"text": system_prompt}]},
        {"role": "model", "parts": [{"text": "Understood. I am Astro-Assistant, ready to help."}]}
    ]
    api_chat_history.extend(chat_history[:-1]) # Add previous conversation for context
    api_chat_history.append({"role": "user", "parts": [{"text": final_prompt}]})

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(api_chat_history)
        print("--- [BACKEND LOG] Successfully got response from Gemini. ---")
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"!!!!!! [BACKEND LOG] ERROR during Gemini API call: {e} !!!!!!")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)