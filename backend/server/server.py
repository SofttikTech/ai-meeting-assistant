import os
import logging
import requests
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from flask_cors import CORS
from io import BytesIO
from dotenv import load_dotenv
import openai
from conversation_analyzer import analyze_conversation

load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'webm'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
openai.api_key = os.getenv("OPENAI_API_KEY")
# CORS(app)

logging.basicConfig(level=logging.INFO)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

MAX_HISTORY = 100
conversation_history = []

def update_conversation_history(new_transcript):
    """Update conversation history and ensure it doesn't exceed the max limit."""
    global conversation_history
    conversation_history.append(new_transcript)

    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)


@app.route('/')
def home():
    return "Welcome to Real World Assistant"

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        logging.info("Received transcription request")
        
        if 'audio' not in request.files:
            logging.error("No audio file received")
            return jsonify({"error": "No audio file received."}), 400

        file = request.files['audio']
        if file.filename == '':
            logging.error("No selected file")
            return jsonify({"error": "No selected file."}), 400

        if not allowed_file(file.filename):
            logging.error(f"Invalid file extension: {file.filename}")
            return jsonify({"error": "Invalid file extension. Only .webm files allowed."}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        with open(filepath, 'rb') as f:
            audio_content = f.read()
            if not audio_content:
                logging.error("Empty audio file")
                return jsonify({"error": "Empty audio file."}), 400
            audio_data = BytesIO(audio_content)

        headers = {"Authorization": f"Bearer {openai.api_key}"}
        files = {
            "file": (filename, audio_data, "audio/webm"),
            "model": (None, "whisper-1"),
        }

        logging.info("Sending to OpenAI Whisper API")
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers=headers,
            files=files
        )

        if response.status_code == 200:
            transcript = response.json().get('text', '')
            logging.info(f"Transcript received: {transcript[:50]}...")
            
            update_conversation_history(transcript)
            ai_response = analyze_conversation(transcript,conversation_history)

            if ai_response:
                logging.info(f"AI Response: {ai_response[:50]}...")
                # socket broadcast
                socketio.emit('update', {'ai_response': ai_response, 'transcript': transcript})
                # socketio.emit('ai_update',ai_response)

            return jsonify({"transcript": transcript})
        else:
            logging.error(f"OpenAI API Error: {response.status_code} - {response.text}")
            return jsonify({"error": "Transcription failed"}), 500

    except Exception as error:
        logging.error(f"Transcription error: {str(error)}")
        return jsonify({"error": "Processing failed"}), 500

@app.route('/generate_summary', methods=['GET'])
def generate_summary():

    if not conversation_history:
        return jsonify({"error": "conversation_history is required"}), 400

    summary = generate_post_meeting_summary(conversation_history)

    return jsonify({"summary": summary})


@socketio.on('connect')
def handle_connect():
    logging.info("Client connected via WebSocket")
    emit('status', {'message': 'Connected to Real World Assistant'})

@socketio.on('disconnect')
def handle_disconnect():
    logging.info("Client disconnected")

if __name__ == "__main__":
    logging.info("Starting server on port 5001")
    socketio.run(app, host="0.0.0.0", port=5001, debug=False)