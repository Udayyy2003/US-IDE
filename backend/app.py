"""
US-IDE Backend - Flask API Server
Production-grade AI-powered IDE backend
"""

import os
import json
import re
import uuid
import jwt
import datetime
import requests
from pathlib import Path
from functools import wraps

# Monkey patch for production (Linux/Render)
if os.name != 'nt':
    try:
        import eventlet
        eventlet.monkey_patch()
    except ImportError:
        pass

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import docker
import threading
from groq import Groq

load_dotenv(override=True)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "us-ide-secret-key-change-in-production")

# Initialize SocketIO (Use threading for Windows, eventlet/gevent for Linux)
async_mode = 'threading' if os.name == 'nt' else None
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=async_mode)

# CORS configuration for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            os.getenv("FRONTEND_URL", "https://us-ide.vercel.app")
        ],
        "supports_credentials": True,
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

# Initialize Groq client
groq_api_key = os.getenv("GROQ_API_KEY", "")
print(f"[US-IDE] Groq API Key loaded: {groq_api_key[:10]}...{groq_api_key[-5:] if groq_api_key else ''}")
groq_client = Groq(api_key=groq_api_key)

# Initialize Docker client
try:
    docker_client = docker.from_env()
    DOCKER_AVAILABLE = True
    print("[US-IDE] Docker connected successfully")
except Exception as e:
    DOCKER_AVAILABLE = False
    print(f"[US-IDE] Docker not available: {e}")

# Base projects directory
BACKEND_DIR = Path(__file__).parent.resolve()
PROJECTS_DIR = Path(os.getenv("PROJECTS_DIR", BACKEND_DIR / "projects"))
PROJECTS_DIR.mkdir(exist_ok=True)

# JWT secret
JWT_SECRET = os.getenv("JWT_SECRET", "us-ide-jwt-secret-change-in-production")

# Google OAuth config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Docker image for code execution
DOCKER_IMAGE = "us-ide-executor"


# ─────────────────────────────────────────────
# Helper: JWT Auth Decorator
# ─────────────────────────────────────────────

def require_auth(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "No token provided"}), 401
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def sanitize_path(base: Path, *parts: str) -> Path:
    """Prevent path traversal attacks"""
    # Remove dangerous characters
    safe_parts = []
    for part in parts:
        safe = re.sub(r'[^a-zA-Z0-9._\-]', '_', part)
        safe_parts.append(safe)
    full_path = base.joinpath(*safe_parts).resolve()
    if not str(full_path).startswith(str(base.resolve())):
        raise ValueError("Path traversal detected")
    return full_path


# ─────────────────────────────────────────────
# Routes: Auth
# ─────────────────────────────────────────────

@app.route("/api/login/google", methods=["POST"])
def google_login():
    """Exchange Google auth code or verify Google token"""
    data = request.json or {}
    token = data.get("token") or data.get("credential")

    if not token:
        return jsonify({"error": "No token provided"}), 400

    # Verify token with Google
    try:
        print(f"[Auth] Verifying token: {token[:20]}...")
        google_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={token}",
            timeout=10
        )
        if google_response.status_code != 200:
            print(f"[Auth Error] Google response: {google_response.text}")
            return jsonify({"error": "Invalid Google token"}), 401

        google_data = google_response.json()
        print(f"[Auth] Google response JSON: {google_data}")

        # Validate audience
        # Use .get("aud") and also check .get("azp") as fallback or for cross-client cases
        token_aud = google_data.get("aud")
        token_azp = google_data.get("azp")
        
        if GOOGLE_CLIENT_ID and token_aud != GOOGLE_CLIENT_ID and token_azp != GOOGLE_CLIENT_ID:
            print(f"[Auth Error] Audience mismatch. Expected: {GOOGLE_CLIENT_ID}, Got aud: {token_aud}, azp: {token_azp}")
            return jsonify({"error": "Token audience mismatch"}), 401

        user_id = google_data.get("sub") or google_data.get("user_id")
        if not user_id:
            print("[Auth Error] No user_id (sub) found in token data")
            return jsonify({"error": "Invalid token: missing user identifier"}), 401
        email = google_data.get("email")
        name = google_data.get("name")
        picture = google_data.get("picture")

        email_verified = google_data.get("email_verified")
        if not email or not (email_verified == True or email_verified == "true"):
            return jsonify({"error": "Email not verified"}), 401

        # Create user directory
        user_dir = PROJECTS_DIR / user_id
        user_dir.mkdir(exist_ok=True)

        # Save user info
        user_info_path = PROJECTS_DIR / user_id / ".user.json"
        user_info = {
            "userId": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "createdAt": str(datetime.datetime.utcnow())
        }
        user_info_path.write_text(json.dumps(user_info, indent=2))

        # Generate JWT
        payload = {
            "userId": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }
        token_jwt = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        return jsonify({
            "token": token_jwt,
            "user": {"userId": user_id, "email": email, "name": name, "picture": picture}
        })

    except Exception as e:
        print(f"[Auth Error] {e}")
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# Routes: Projects
# ─────────────────────────────────────────────

@app.route("/api/projects", methods=["GET"])
@require_auth
def list_projects():
    """List all projects for the authenticated user"""
    user_id = request.user["userId"]
    print(f"[Projects] Listing projects for user: {user_id}")
    user_dir = PROJECTS_DIR / user_id
    user_dir.mkdir(exist_ok=True)

    projects = []
    for item in user_dir.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            meta_path = item / ".meta.json"
            meta = {}
            if meta_path.exists():
                try:
                    meta = json.loads(meta_path.read_text())
                except Exception as e:
                    print(f"[Projects Error] Failed to parse meta for {item.name}: {e}")
            
            projects.append({
                "name": item.name,
                "language": meta.get("language", "python"),
                "createdAt": meta.get("createdAt", "")
            })

    print(f"[Projects] Found {len(projects)} projects")
    return jsonify({"projects": projects})


@app.route("/api/create-project", methods=["POST"])
@require_auth
def create_project():
    """Create a new project with default Hello World file"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "").strip()
    language = data.get("language", "python").lower()
    file_name = data.get("fileName", "").strip()

    if not project_name:
        return jsonify({"error": "Project name required"}), 400

    # Map language to file extension and default content
    lang_map = {
        "python": {"ext": ".py", "default_file": "main.py"},
        "c":      {"ext": ".c",  "default_file": "main.c"},
        "cpp":    {"ext": ".cpp","default_file": "main.cpp"},
        "java":   {"ext": ".java","default_file": "Main.java"},
    }

    if language not in lang_map:
        return jsonify({"error": f"Unsupported language: {language}"}), 400

    hello_world = {
        "python": 'print("Hello, World!")\n',
        "c": '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
        "cpp": '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n',
        "java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
    }

    lang_info = lang_map[language]

    # Determine file name
    if not file_name:
        actual_file = lang_info["default_file"]
    else:
        if not file_name.endswith(lang_info["ext"]):
            actual_file = file_name + lang_info["ext"]
        else:
            actual_file = file_name

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        project_dir.mkdir(parents=True, exist_ok=True)

        # Write default file
        file_path = project_dir / actual_file
        file_path.write_text(hello_world[language])

        # Save project metadata
        meta = {
            "projectName": project_name,
            "language": language,
            "mainFile": actual_file,
            "createdAt": str(datetime.datetime.utcnow())
        }
        (project_dir / ".meta.json").write_text(json.dumps(meta, indent=2))

        return jsonify({
            "success": True,
            "projectName": project_name,
            "language": language,
            "fileName": actual_file,
            "content": hello_world[language]
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"[Create Project Error] {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/project-files", methods=["POST"])
@require_auth
def list_project_files():
    """List all files in a project"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "")

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        if not project_dir.exists():
            return jsonify({"error": "Project not found"}), 404

        files = []
        for f in project_dir.rglob("*"):
            if f.is_file() and not f.name.startswith("."):
                relative = f.relative_to(project_dir)
                files.append(str(relative))

        return jsonify({"files": files})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/create-file", methods=["POST"])
@require_auth
def create_file():
    """Create a new file in a project"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "")
    file_name = data.get("fileName", "")
    content = data.get("content", "")

    if not project_name or not file_name:
        return jsonify({"error": "Project name and file name required"}), 400

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        file_path = sanitize_path(project_dir, file_name)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content)
        return jsonify({"success": True, "fileName": file_name})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-file", methods=["POST"])
@require_auth
def save_file():
    """Save file content"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "")
    file_name = data.get("fileName", "")
    content = data.get("content", "")

    if not project_name or not file_name:
        return jsonify({"error": "Project name and file name required"}), 400

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        file_path = sanitize_path(project_dir, file_name)
        file_path.write_text(content)
        return jsonify({"success": True})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/load-file", methods=["POST"])
@require_auth
def load_file():
    """Load file content"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "")
    file_name = data.get("fileName", "")

    if not project_name or not file_name:
        return jsonify({"error": "Project name and file name required"}), 400

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        file_path = sanitize_path(project_dir, file_name)
        if not file_path.exists():
            return jsonify({"error": "File not found"}), 404
        content = file_path.read_text()
        return jsonify({"content": content, "fileName": file_name})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
# Routes: Code Execution
# ─────────────────────────────────────────────

@app.route("/api/run-code", methods=["POST"])
@require_auth
def run_code():
    """Execute code in Docker container"""
    data = request.json or {}
    user_id = request.user["userId"]
    project_name = data.get("projectName", "")
    file_name = data.get("fileName", "")
    code = data.get("code", "")
    language = data.get("language", "python").lower()
    stdin_data = data.get("stdin", "")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    # Execution commands per language
    exec_commands = {
        "python": f"python {file_name} < .stdin",
        "c":      f"gcc {file_name} -o /tmp/prog -lm 2>&1 && /tmp/prog < .stdin",
        "cpp":    f"g++ {file_name} -o /tmp/prog -lm 2>&1 && /tmp/prog < .stdin",
        "java":   f"javac {file_name} 2>&1 && java {file_name.replace('.java', '')} < .stdin",
    }

    if language not in exec_commands:
        return jsonify({"error": f"Unsupported language: {language}"}), 400

    if not DOCKER_AVAILABLE:
        return jsonify({
            "error": "Docker not available on this server",
            "output": "",
            "stderr": "Docker execution environment not configured"
        }), 503

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        project_dir.mkdir(parents=True, exist_ok=True)

        # Write code and stdin to files
        actual_file = file_name or "main.py"
        (project_dir / actual_file).write_text(code)
        (project_dir / ".stdin").write_text(stdin_data)

        command = exec_commands[language]

        # Run in Docker container
        container = docker_client.containers.run(
            DOCKER_IMAGE,
            command=f"/bin/sh -c '{command}'",
            working_dir="/code",
            volumes={
                str(project_dir.resolve()): {"bind": "/code", "mode": "rw"} # Need write for java class files etc
            },
            mem_limit="128m",
            cpu_period=100000,
            cpu_quota=50000,   # 50% CPU
            network_disabled=True,
            detach=True,
            stdout=True,
            stderr=True,
        )

        try:
            # Wait for execution with timeout
            result = container.wait(timeout=30)
            output = container.logs(stdout=True, stderr=False).decode("utf-8")
            stderr = container.logs(stdout=False, stderr=True).decode("utf-8")
            
            return jsonify({
                "output": output,
                "stderr": stderr,
                "success": True if result["StatusCode"] == 0 else False
            })
        except Exception as e:
            # Handle timeout or other errors
            try:
                container.kill()
            except:
                pass
            return jsonify({
                "error": "Execution timed out or failed",
                "output": "",
                "stderr": str(e)
            }), 500
        finally:
            try:
                container.remove()
                # Clean up stdin file
                if (project_dir / ".stdin").exists():
                    (project_dir / ".stdin").unlink()
            except:
                pass

    except docker.errors.ContainerError as e:
        stderr = e.stderr.decode("utf-8") if e.stderr else str(e)
        return jsonify({"output": "", "stderr": stderr, "success": False})
    except docker.errors.ImageNotFound:
        return jsonify({
            "error": "Docker image not built. Run: docker build -t us-ide-executor ./executor",
            "output": "",
            "stderr": "Execution image not found"
        }), 503
    except Exception as e:
        print(f"[Run Code Error] {e}")
        return jsonify({"error": str(e), "output": "", "stderr": str(e)}), 500


# ─────────────────────────────────────────────
# Routes: AI Chat
# ─────────────────────────────────────────────

@app.route("/api/ai-chat", methods=["POST"])
@require_auth
def ai_chat():
    """AI-powered code assistant using Groq"""
    data = request.json or {}
    message = data.get("message", "")
    code = data.get("code", "")
    language = data.get("language", "python")
    history = data.get("history", [])
    action = data.get("action", "chat")  # chat | explain | fix | optimize | generate

    if not message and action == "chat":
        return jsonify({"error": "Message required"}), 400

    # Build system prompt
    system_prompt = f"""You are US-IDE AI Assistant, an expert programming assistant integrated into the US-IDE coding environment.

Current context:
- Language: {language}
- IDE: US-IDE (browser-based)

You help users with:
- Writing and explaining code
- Fixing bugs and errors
- Optimizing code performance
- Generating new code snippets
- Answering programming questions

When providing code, always wrap it in proper markdown code blocks with the language specified.
Be concise, technical, and helpful. Focus on practical solutions."""

    # Build messages
    messages = [{"role": "system", "content": system_prompt}]

    # Add history (last 10 messages for context)
    for msg in history[-10:]:
        if msg.get("role") in ("user", "assistant"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Build user message based on action
    if action == "explain" and code:
        user_content = f"Explain this {language} code:\n\n```{language}\n{code}\n```"
    elif action == "fix" and code:
        user_content = f"Fix errors in this {language} code and explain what was wrong:\n\n```{language}\n{code}\n```"
    elif action == "optimize" and code:
        user_content = f"Optimize this {language} code for better performance and readability:\n\n```{language}\n{code}\n```"
    elif action == "generate":
        user_content = f"Generate {language} code for: {message}"
    else:
        if code:
            user_content = f"{message}\n\nCurrent code:\n```{language}\n{code}\n```"
        else:
            user_content = message

    messages.append({"role": "user", "content": user_content})

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=2048,
            temperature=0.7,
        )

        response_text = completion.choices[0].message.content

        return jsonify({
            "response": response_text,
            "success": True
        })

    except Exception as e:
        print(f"[AI Chat Error] {e}")
        return jsonify({"error": str(e), "success": False}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "US-IDE Backend",
        "docker": DOCKER_AVAILABLE,
        "groq": bool(os.getenv("GROQ_API_KEY"))
    })


# ─────────────────────────────────────────────
# SocketIO: Interactive Terminal
# ─────────────────────────────────────────────

# Store active sessions: sid -> {container, thread}
active_terminals = {}

@socketio.on('connect')
def handle_connect():
    print(f"[Terminal] Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f"[Terminal] Client disconnected: {sid}")
    if sid in active_terminals:
        try:
            active_terminals[sid]['stdin_sock'].close()
            active_terminals[sid]['container'].kill()
            active_terminals[sid]['container'].remove()
        except:
            pass
        del active_terminals[sid]

@socketio.on('start_terminal')
def handle_start_terminal(data):
    sid = request.sid
    print(f"[Terminal] Start request from {sid}")
    token = data.get('token')
    project_name = data.get('projectName')
    file_name = data.get('fileName')
    code = data.get('code')
    language = data.get('language', 'python').lower()

    if not token:
        emit('terminal_output', {'text': 'Error: Authentication required\r\n', 'type': 'error'})
        return

    try:
        # Verify JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['userId']
    except Exception as e:
        emit('terminal_output', {'text': f'Error: Invalid token - {str(e)}\r\n', 'type': 'error'})
        return

    # If terminal already exists for this sid, clean it up
    if sid in active_terminals:
        try:
            active_terminals[sid]['stdin_sock'].close()
            active_terminals[sid]['container'].kill()
            active_terminals[sid]['container'].remove()
        except:
            pass

    try:
        project_dir = sanitize_path(PROJECTS_DIR / user_id, project_name)
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Write code to file
        actual_file = file_name or "main.py"
        (project_dir / actual_file).write_text(code)

        # Build command based on language
        if language == "python":
            command = f"python -u {actual_file}"
        elif language == "c":
            command = f"gcc {actual_file} -o /tmp/prog -lm 2>&1 && /tmp/prog"
        elif language == "cpp":
            command = f"g++ {actual_file} -o /tmp/prog -lm 2>&1 && /tmp/prog"
        elif language == "java":
            command = f"javac {actual_file} 2>&1 && java {actual_file.replace('.java', '')}"
        else:
            emit('terminal_output', {'text': f'Error: Unsupported language {language}\r\n', 'type': 'error'})
            return

        # Start interactive container
        print(f"[Terminal] Running container for {language}")
        container = docker_client.containers.run(
            DOCKER_IMAGE,
            command=f"/bin/sh -c '{command}'",
            working_dir="/code",
            volumes={str(project_dir.resolve()): {"bind": "/code", "mode": "rw"}},
            mem_limit="128m",
            cpu_period=100000,
            cpu_quota=50000,
            network_disabled=True,
            detach=True,
            tty=True,
            stdin_open=True,
        )

        # Get stdin socket once and keep it open
        stdin_sock = container.attach_socket(params={'stdin': 1, 'stream': 1})
        print(f"[Terminal] Stdin socket attached for {sid}")

        # Store in active terminals
        active_terminals[sid] = {
            'container': container,
            'stdin_sock': stdin_sock
        }

        # Thread to read output and emit to client
        def stream_output(sid, container):
            print(f"[Terminal] Starting output stream for {sid}")
            try:
                # Use attach to get output stream
                for line in container.attach(stdout=True, stderr=True, stream=True, logs=True):
                    if sid in active_terminals:
                        socketio.emit('terminal_output', {'text': line.decode('utf-8')}, room=sid)
                
                # Once output stream ends, wait for container to exit and notify client
                res = container.wait()
                print(f"[Terminal] Container exited with {res['StatusCode']} for {sid}")
                socketio.emit('terminal_output', {'text': f'\r\nProcess exited with code {res["StatusCode"]}\r\n', 'type': 'system'}, room=sid)
            except Exception as e:
                print(f"[Terminal Stream Error] {e}")
                if sid in active_terminals:
                    socketio.emit('terminal_output', {'text': f'\r\n[Terminal Error] {str(e)}\r\n', 'type': 'error'}, room=sid)
            finally:
                if sid in active_terminals:
                    try:
                        active_terminals[sid]['stdin_sock'].close()
                        container.remove()
                    except:
                        pass
                    del active_terminals[sid]
                    print(f"[Terminal] Session cleaned up for {sid}")

        thread = threading.Thread(target=stream_output, args=(sid, container))
        thread.daemon = True
        thread.start()

    except Exception as e:
        emit('terminal_output', {'text': f'Error starting terminal: {str(e)}\r\n', 'type': 'error'})

@socketio.on('terminal_input')
def handle_terminal_input(data):
    sid = request.sid
    text = data.get('text')
    # print(f"[Terminal Input] from {sid}: {repr(text)}") # Comment out for performance
    if sid in active_terminals and text:
        try:
            # Use the already open stdin socket
            sock = active_terminals[sid]['stdin_sock']
            if hasattr(sock, '_sock'):
                sock._sock.send(text.encode('utf-8'))
            else:
                sock.send(text.encode('utf-8'))
        except Exception as e:
            print(f"[Terminal Input Error] {e}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    print(f"[US-IDE] Starting SocketIO server (threading mode) on port {port}")
    socketio.run(app, host="0.0.0.0", port=port, debug=debug)
