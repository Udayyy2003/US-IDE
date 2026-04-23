from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import os

app = Flask(__name__)
CORS(app)

# Load Whisper model (base is small and fast)
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded.")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    audio = request.files["audio"]
    file_path = "temp_audio.wav"
    
    try:
        audio.save(file_path)
        
        # Transcribe audio file
        result = model.transcribe(file_path)
        text = result["text"].strip()
        
        print(f"Transcribed: {text}")
        
        return jsonify({"text": text})
    except Exception as e:
        print(f"Transcription error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    app.run(port=5001)
