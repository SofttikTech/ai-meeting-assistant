# import os
# import logging
# import requests
# from flask import Flask, request, jsonify
# from werkzeug.utils import secure_filename
# from io import BytesIO
# from dotenv import load_dotenv
# from flask_cors import CORS
# import openai
# import json
# from conversation_analyzer import analyze_conversation, update_conversation_history



# load_dotenv()

# app = Flask(__name__)
# # CORS(app)
# app.config['UPLOAD_FOLDER'] = 'uploads'
# app.config['ALLOWED_EXTENSIONS'] = {'webm'}
# app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 

# openai.api_key = os.getenv("OPENAI_API_KEY")

# logging.basicConfig(level=logging.DEBUG)

# if not os.path.exists(app.config['UPLOAD_FOLDER']):
#     os.makedirs(app.config['UPLOAD_FOLDER'])

# def allowed_file(filename):
#     print(f"Checking if file {filename} has an allowed extension...")
#     return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# @app.route('/', methods=['Get'])
# def check():
#     return "Welcome to real world"

# @app.route("/transcribe", methods=["POST"])
# def transcribe():
#     try:
#         print("Received request for transcription...")

#         print("Checking if the 'audio' field is present in the request...")
#         if 'audio' not in request.files:
#             print("Error: No audio file received.")
#             return jsonify({"error": "No audio file received."}), 400

#         file = request.files['audio']

#         print("Checking if file has a valid name...")
#         if file.filename == '':
#             print("Error: No selected file.")
#             return jsonify({"error": "No selected file."}), 400

#         # Check file extension
#         # print("Checking file extension...")
#         if not allowed_file(file.filename):
#             print(f"Invalid file extension: {file.filename}")
#             return jsonify({"error": "Invalid file extension. Only .webm files are allowed."}), 400

#         # Save the file to the server temporarily
#         filename = secure_filename(file.filename)
#         filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#         print(f"Saving the file to {filepath}...")
#         file.save(filepath)

#         with open(filepath, 'rb') as f:
#             # audio_data = BytesIO(f.read())
#             audio_content = f.read()
#             if not audio_content:
#                 print("Error: The file is empty.")
#                 return jsonify({"error": "The uploaded file is empty."}), 400
#             audio_data = BytesIO(audio_content)
                
#         headers = {
#             "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}",
#         }
#         files = {
#             "file": (filename, audio_data, "audio/webm"),
#             "model": (None, "whisper-1"),
#         }

#         print("Sending audio file to OpenAI Whisper API for transcription...")
        
#         response = requests.post("https://api.openai.com/v1/audio/transcriptions", headers=headers, files=files)
        
#         if response.status_code == 200:
#             print("Received transcription from OpenAI Whisper.")
#             transcript = response.json().get('text', '')
#             print(f"Transcription: {transcript}")
#             update_conversation_history(transcript)
#             ai_response = analyze_conversation(transcript)
#             print("Response", ai_response)
#             if ai_response != None:
#                 with open("response.txt", "w", encoding='utf-8') as file:
#                     file.write(ai_response)
#                 # try:
#                 #     with open(file_path, "r") as f:
#                 #         data = json.load(f)
#                 # except (FileNotFoundError, json.JSONDecodeError):
#                 #     data = {"responses": []}

#                 # data["responses"].append(ai_response)
                
#                 # with open(file_path, "w") as f:
#                 #     json.dump(data, f, indent=2)
#                 # print("Response ",ai_response)
#             return jsonify({"transcript": transcript})
#         else:
#             print(f"Error from OpenAI API: {response.status_code} - {response.text}")
#             print(f"DEBUG: OpenAI Response Headers: {response.headers}")
#             return jsonify({"error": "Failed to get transcription from OpenAI."}), 500
        
#         # update_conversation_history(transcript)

#         # ai_response = analyze_conversation()

#         # print("Response ",ai_response)

#     except Exception as error:
#         print(f"Error during transcription process: {error}")
#         return jsonify({"error": "Transcription failed."}), 500

# if __name__ == "__main__":
#     print("Starting Flask server...")
#     app.run(debug=False, host="127.0.0.1", port=5001)



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
from conversation_analyzer import analyze_conversation, update_conversation_history

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
            ai_response = analyze_conversation(transcript)

            if ai_response:
                logging.info(f"AI Response: {ai_response[:50]}...")
                # socket broadcast
                socketio.emit('ai_update',ai_response)

            return jsonify({"transcript": transcript})
        else:
            logging.error(f"OpenAI API Error: {response.status_code} - {response.text}")
            return jsonify({"error": "Transcription failed"}), 500

    except Exception as error:
        logging.error(f"Transcription error: {str(error)}")
        return jsonify({"error": "Processing failed"}), 500

@socketio.on('connect')
def handle_connect():
    logging.info("Client connected via WebSocket")
    emit('status', {'message': 'Connected to Real World Assistant'})

@socketio.on('disconnect')
def handle_disconnect():
    logging.info("Client disconnected")

if __name__ == "__main__":
    logging.info("Starting unified server on port 5001")
    socketio.run(app, host="0.0.0.0", port=5001, debug=False)