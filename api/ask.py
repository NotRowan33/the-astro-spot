from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
from bs4 import BeautifulSoup
from googleapiclient.discovery import build
import google.generativeai as genai
from datetime import datetime

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure the Gemini API
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"CRITICAL ERROR: Failed to configure Gemini API. Check your GEMINI_API_KEY. Error: {e}")

def get_web_context(query):
    print(f"--- [BACKEND LOG] Searching web for: '{query}' ---")
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        search_engine_id = os.getenv("SEARCH_ENGINE_ID")
        
        if not api_key or not search_engine_id:
            print("--- [BACKEND LOG] WARNING: Google Search API keys not found. ---")
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
            for element in soup(["script", "style", "header", "footer", "nav", "aside"]):
                element.extract()
            
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
    chat_history = data.get('history', [])
    if not chat_history:
        return jsonify({"error": "Invalid request: history is missing"}), 400

    user_question = chat_history[-1]['parts'][0]['text']
    
    # Get the current date and time
    current_date = datetime.now().strftime("%A, %B %d, %Y")

    # Decide if a web search is necessary
    search_keywords = ['what are', 'specs', 'specifications', 'who is', 'when is', 'price of']
    should_search = any(keyword in user_question.lower() for keyword in search_keywords)
    
    web_context = None
    if should_search:
        web_context = get_web_context(user_question)
    else:
        print("--- [BACKEND LOG] Conversational query. Skipping web search. ---")

    # This is the new, much more powerful system prompt
    system_prompt = f"""You are Astro-Assistant, an expert AI specializing in astronomy and astrophotography.
    The current date is {current_date}. Use this for any time-sensitive questions like 'what can I see tonight?'.
    You have been provided with real-time web search results as 'Web Context' when necessary.
    You MUST prioritize the information in the 'Web Context' to answer the user's question accurately.
    If the Web Context is empty or does not contain the answer, you may use your own knowledge.
    Always format your responses using Markdown for clarity.
    You must NEVER mention that you are an AI.
    """

    # We build a new, clean set of contents for the API call
    api_contents = [
        {"role": "user", "parts": [{"text": system_prompt}]},
        {"role": "model", "parts": [{"text": "Understood. I am ready to assist."}]}
    ]

    # Add the user's actual conversation history
    # We strip the AI's welcome message from the history sent to the API
    if len(chat_history) > 1:
        api_contents.extend(chat_history[1:])

    # If we have web context, we modify the last user question to include it.
    if web_context:
        final_user_message = api_contents[-1]['parts'][0]['text']
        enhanced_prompt = f"""Based on the following up-to-date web context, please provide a comprehensive answer to the user's question.
        
        Web Context:
        ---
        {web_context}
        ---
        
        User's Question: {final_user_message}"""
        api_contents[-1]['parts'][0]['text'] = enhanced_prompt

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(api_contents)
        print("--- [BACKEND LOG] Successfully got response from Gemini. ---")
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"!!!!!! [BACKEND LOG] ERROR during Gemini API call: {e} !!!!!!")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)