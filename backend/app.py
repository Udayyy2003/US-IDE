"""
US-IDE Backend - Flask API Server
This server handles authentication and AI proxy services for the US-IDE desktop application.
"""

import os
import sys
import json
import re
import uuid
import requests
from pathlib import Path
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(override=True)

print(f"[US-IDE] Starting backend on {os.name} with Python {sys.version}")
print(f"[US-IDE] Environment: {os.getenv('FLASK_ENV', 'production')}")

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "us-ide-secret-key-change-in-production")

# CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["https://us-ide.vercel.app", "http://localhost:5173"],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "OPTIONS"]
    }
})

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY", "")
if groq_api_key:
    print(f"[US-IDE] Groq API Key loaded: {groq_api_key[:10]}...")
    groq_client = Groq(api_key=groq_api_key)
else:
    print("[US-IDE] WARNING: GROQ_API_KEY not found")
    groq_client = None

# Base projects directory (not used for code, only for user metadata if needed)
BACKEND_DIR = Path(__file__).parent.resolve()
DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data"))
DATA_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────
# Routes: AI Chat
# ─────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
@app.route("/api/ai-chat", methods=["POST"])
def ai_chat():
    """AI-powered code assistant using Groq"""
    data = request.json or {}
    message = data.get("message", "")
    code = data.get("code", "")
    language = data.get("language", "python")
    history = data.get("history", [])
    action = data.get("action", "chat")

    if not message and action == "chat":
        return jsonify({"error": "Message required"}), 400

    if not groq_client:
        return jsonify({"error": "AI Assistant not configured (missing API key)"}), 503

    system_prompt = f'''You are US-IDE AI Assistant, an expert programming assistant integrated into the US-IDE desktop coding environment.

Current context:
- Language: {language}
- IDE: US-IDE (Desktop for Windows)

You help users with:
- Writing and explaining code
- Fixing bugs and errors
- Optimizing code performance
- Generating new code snippets from prompts

When providing code, always wrap it in proper markdown code blocks with the language specified.
Be concise, technical, and helpful. Focus on practical solutions.'''

    messages = [{"role": "system", "content": system_prompt}]
    
    # Clean up history to remove unsupported fields like 'timestamp' or 'error'
    for msg in history[-10:]:
        clean_msg = {
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        }
        messages.append(clean_msg)

    user_content = f"Action: {action}\nLanguage: {language}\nUser Message: {message}"
    if code:
        user_content += f"\n\nCode Context:\n```{language}\n{code}\n```"

    messages.append({"role": "user", "content": user_content})

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=2048,
            temperature=0.7,
        )
        response_text = completion.choices[0].message.content
        return jsonify({"response": response_text, "success": True})

    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return jsonify({"error": str(e), "success": False}), 500

# ─────────────────────────────────────────────
# Routes: Health Check
# ─────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "service": "US-IDE Backend Proxy",
        "groq_configured": bool(groq_client)
    })

# ─────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    print(f"[US-IDE] Starting Backend Proxy on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
