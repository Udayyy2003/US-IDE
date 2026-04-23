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
import tempfile
from pathlib import Path
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv(override=True)

# Safety check for API Key
if not os.getenv("GROQ_API_KEY"):
    print("Groq Key Loaded: False")
    raise ValueError("GROQ_API_KEY is missing from .env file")
else:
    print("Groq Key Loaded: True")

print(f"[US-IDE] Starting backend on {os.name} with Python {sys.version}")
print(f"[US-IDE] Environment: {os.getenv('FLASK_ENV', 'production')}")

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "us-ide-secret-key-change-in-production")

# CORS configuration
CORS(app)

@app.route("/")
def index():
    return jsonify({
        "status": "online",
        "message": "US-IDE Backend API is running",
        "version": "1.0.0"
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

# ─── Helper: True Recursive Tree Builder ──────
def build_tree(path): 
    items = [] 
    try: 
        for entry in os.listdir(path): 
            full_path = os.path.join(path, entry) 
            if os.path.isdir(full_path): 
                items.append({ 
                    "name": entry, 
                    "isDirectory": True, 
                    "path": full_path, 
                    "children": build_tree(full_path)  # RECURSION 
                }) 
            else: 
                items.append({ 
                    "name": entry, 
                    "isDirectory": False, 
                    "path": full_path 
                }) 
    except Exception as e: 
        print("Error reading directory:", e) 
 
    return items 

# ─────────────────────────────────────────────
# Routes: File Tree
# ─────────────────────────────────────────────

@app.route("/api/file-tree", methods=["POST"])
def get_file_tree():
    """Returns a TRUE recursive file tree for the project"""
    data = request.json or {}
    root_path = data.get("root_path")
    
    if not root_path or not os.path.exists(root_path):
        return jsonify({"error": "Invalid root path", "success": False}), 400
        
    try:
        tree = build_tree(root_path)
        
        # 🔍 DEBUG (MANDATORY)
        import json
        print("TREE:", json.dumps(tree, indent=2))
        
        return jsonify(tree)
    except Exception as e:
        print(f"[File Tree Error] {e}")
        return jsonify({"error": str(e), "success": False}), 500

# ─────────────────────────────────────────────
# Routes: File Operations (New)
# ─────────────────────────────────────────────

@app.route("/api/read-file", methods=["POST"])
def read_file():
    data = request.json or {}
    file_path = data.get("path")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid file path", "success": False}), 400
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return jsonify({"content": content, "success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/save-file", methods=["POST"])
def save_file():
    data = request.json or {}
    file_path = data.get("path")
    content = data.get("content", "")
    if not file_path:
        return jsonify({"error": "Invalid file path", "success": False}), 400
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/create-file", methods=["POST"])
def create_file_api():
    data = request.json or {}
    root_path = data.get("root_path")
    file_path = data.get("path") # relative to root or absolute
    if not file_path:
        return jsonify({"error": "Invalid path", "success": False}), 400
    
    full_path = file_path if os.path.isabs(file_path) else os.path.join(root_path, file_path)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write("")
        return jsonify({"success": True, "path": full_path})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/create-folder", methods=["POST"])
def create_folder_api():
    data = request.json or {}
    root_path = data.get("root_path")
    dir_path = data.get("path")
    if not dir_path:
        return jsonify({"error": "Invalid path", "success": False}), 400
    
    full_path = dir_path if os.path.isabs(dir_path) else os.path.join(root_path, dir_path)
    try:
        os.makedirs(full_path, exist_ok=True)
        return jsonify({"success": True, "path": full_path})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/delete-file", methods=["POST"])
def delete_file_api():
    data = request.json or {}
    file_path = data.get("path")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid path", "success": False}), 400
    try:
        if os.path.isdir(file_path):
            import shutil
            shutil.rmtree(file_path)
        else:
            os.remove(file_path)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/rename-file", methods=["POST"])
def rename_file_api():
    data = request.json or {}
    old_path = data.get("path")
    new_name = data.get("new_name")
    if not old_path or not new_name:
        return jsonify({"error": "Invalid path or name", "success": False}), 400
    try:
        parent = os.path.dirname(old_path)
        new_path = os.path.join(parent, new_name)
        os.rename(old_path, new_path)
        return jsonify({"success": True, "path": new_path})
    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500

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
    
    # Context enhancement
    current_file = data.get("current_file", "")
    file_tree = data.get("file_tree", [])
    workspace_root = data.get("workspace_root", "")

    if not message and action == "chat":
        return jsonify({"error": "Message required"}), 400

    if not groq_client:
        return jsonify({"error": "AI Assistant not configured (missing API key)"}), 503

    system_prompt = f'''You are US-IDE AI Assistant, an expert programming assistant integrated into the US-IDE desktop coding environment.

Current context:
- Workspace Root: {workspace_root}
- Current Active File: {current_file or "None"}
- Project Files: {json.dumps([f.get('name') for f in file_tree if not f.get('isDirectory')] if file_tree else "None")}
- Language: {language}

AI Capabilities & Guidelines:
1. Context Validation: If no folder is open (Workspace Root is empty), advise the user to open a folder for file operations.
2. File Decision Engine:
   - If the user asks to create a file or the prompt implies it (e.g., "create a hello world python script"), suggest a file name.
   - If multiple files exist but none are open, ask the user which file they want to modify.
   - If a file is open, use it as the default target.
3. AI Response Structure:
   - Briefly explain the plan.
   - Provide the code in markdown blocks.
   - If suggesting a NEW file, use the format: `[CREATE_FILE: filename.ext]` followed by the code block.
   - If modifying the CURRENT file, use `[MODIFY_FILE: current]` followed by the code block.
4. Smart File Naming: Generate names based on content (e.g., .py for Python, .js for JS).
5. Java Folder Structure:
   - If the generated code is Java or the user mentions Java, ALWAYS suggest creating/using a structured folder: `java/<ClassName>/<ClassName>.java`.
   - Use the format: `[CREATE_FILE: java/ClassName/ClassName.java]` for new Java files.
   - ALWAYS include this specific sentence in your response: "I will create this Java file inside its own folder (/java/<ClassName>/) to keep your project clean and structured."
   - Explain that this keeps each Java program isolated with its compiled .class files.

Focus on being technical, concise, and helpful.'''

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
# Routes: Voice to Text
# ─────────────────────────────────────────────

@app.route("/voice-to-text", methods=["POST"])
def voice_to_text():
    """Convert speech to text using Groq's Whisper API (dynamic)"""
    if not groq_client:
        return jsonify({"error": "Voice service not configured (missing API key)"}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files['file']
    if audio_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # Transcribe using Groq Whisper
        with open(tmp_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(tmp_path, file.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",
                temperature=0.0
            )

        # Cleanup temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        recognized_text = transcription.text.strip()
        print(f"Transcribed: {recognized_text}")
        
        return jsonify({
            "text": recognized_text,
            "success": True
        })

    except Exception as e:
        print(f"[Voice to Text Error] {e}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route("/api/search-content", methods=["POST"])
def search_content():
    """Deep search for a query string inside all files in the project root"""
    data = request.json
    query = data.get("query", "").lower()
    root_path = data.get("root_path")

    if not query or not root_path:
        return jsonify({"results": [], "success": True})

    results = []
    
    def search_recursive(path):
        try:
            for entry in os.listdir(path):
                if entry.startswith('.'):
                    continue
                full_path = os.path.join(path, entry)
                if os.path.isdir(full_path):
                    search_recursive(full_path)
                else:
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.readlines()
                            for line_num, line in enumerate(content, 1):
                                if query in line.lower():
                                    results.append({
                                        "name": entry,
                                        "path": full_path,
                                        "line": line_num,
                                        "preview": line.strip()
                                    })
                                    if len([r for r in results if r['path'] == full_path]) > 5:
                                        break
                    except:
                        continue
                if len(results) > 100:
                    break
        except Exception as e:
            print(f"Error searching {path}: {e}")

    try:
        search_recursive(root_path)
        return jsonify({"results": results, "success": True})
    except Exception as e:
        print(f"[Search Content Error] {e}")
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
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("FLASK_ENV") == "development"
    print(f"[US-IDE] Starting Backend Proxy on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
