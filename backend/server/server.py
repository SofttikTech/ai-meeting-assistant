import os
import logging
import requests
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename
from flask_cors import CORS
from io import BytesIO
from dotenv import load_dotenv
from conversation_analyzer import analyze_conversation, generate_post_meeting_summary, generate_client_meeting_summary, find_additional_campaign_interests, analyze_conversation_telephonic
from ghl_integration import send_data_to_n8n_and_log
from datetime import datetime
import json

load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")  

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'webm'}
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

logging.basicConfig(level=logging.INFO)

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

MAX_HISTORY = 80
conversation_history = []
ai_response = ""
total_meeting_minutes = 15

def update_conversation_history(new_transcript):
    global conversation_history
    conversation_history.append(new_transcript)
    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)

@app.route('/')
def home():
    return "Welcome to Real World Assistant"

@app.route("/transcribe", methods=["POST"])
def transcribe():
    ai_response = ""
    try:
        logging.info("Received transcription request")
        meetingType = request.form.get("meetingType")
        start_str = request.form.get("startTime")
        current_str = request.form.get("currenTime")
        raw = request.form.get("messages")
        messages =json.loads(raw)
        logging.info(f"Messages: {messages}")
        logging.info(f"Meeting Type: {meetingType}")
        logging.info(f"start Time received: {start_str}")
        logging.info(f"current Time received: {current_str}")

        # calculating remaining time of meeting
        fmt = "%H:%M:%S"
        start_time = datetime.strptime(start_str, fmt)
        current_time = datetime.strptime(current_str, fmt)

        if current_time < start_time:
            current_time = current_time.replace(day=start_time.day + 1)

        diff_seconds = (current_time - start_time).total_seconds()

        # Convert to minutes
        diff_minutes = diff_seconds / 60
        logging.info(f"Difference: {diff_minutes}")

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

        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": "audio/webm"
        }
        deepgram_url = "https://api.deepgram.com/v1/listen?async=true&punctuate=true"

        logging.info("Sending audio to Deepgram API for transcription")
        response = requests.post(
            deepgram_url,
            headers=headers,
            data=audio_data
        )

        if response.status_code == 200:
            json_response = response.json()
            transcript = json_response.get("results", {}) \
                      .get("channels", [{}])[0] \
                      .get("alternatives", [{}])[0] \
                      .get("transcript", "")
            # logging.info(f"Transcript received: {transcript[:50]}...")
            # print(transcript)
            
            messages.append({"role":"user","content":transcript})
            print("Before sending: ", messages)
            update_conversation_history(transcript)
            
            if meetingType == "In Place":
                ai_response = analyze_conversation(transcript, messages.copy(), total_meeting_minutes, diff_minutes)
                print("Response in Server: ",ai_response)
            elif meetingType == "Telephonic":
                ai_response = analyze_conversation_telephonic(transcript, messages.copy(), total_meeting_minutes, diff_minutes)

            if ai_response['type']=="question":            
                messages.append({"role":"assistant","content":ai_response['question']})
            elif ai_response["type"]=="pain_point":
                messages.append({"role":"assistant","content":ai_response['pain_point']})
            elif ai_response["type"]=="recommendation":
                messages.append({"role":"assistant","content":ai_response['recommendation']})

            
            print("Messages array: ",messages)

            if ai_response:
                # logging.info(f"AI Response: {ai_response[:50]}...")
                socketio.emit('update', {'ai_response': ai_response, 'transcript': transcript, 'messages':messages})

            return jsonify({"transcript": transcript})
        else:
            logging.error(f"Deepgram API Error: {response.status_code} - {response.text}")
            return jsonify({"error": "Transcription failed"}), 500

    except Exception as error:
        logging.error(f"Transcription error: {str(error)}")
        return jsonify({"error": "Processing failed"}), 500

@app.route('/generate_summary', methods=['GET'])
def generate_summary():
    ai_response = request.args.get('ai_response')
    transcript = request.args.get('transcript')
    user_id = request.args.get('user_id')
    admin_id = request.args.get('admin_id')
    firstName = request.args.get('FirstName')
    lastName = request.args.get('LastName')
    email = request.args.get('Email')
    phoneNumber = request.args.get('phoneNumber')
    campaign = request.args.get('campaign')
    history = request.args.get('history')

    print("History in Generate Summary: ", history)

    if not transcript:
        return jsonify({"error": "conversation_history is required"}), 400        

    summary = generate_post_meeting_summary(history)
    client_summary = generate_client_meeting_summary(history)
    new_data = find_additional_campaign_interests(history)
    print("Summary:", summary)
    print("AI response:", ai_response)
    print("Transcript:", transcript)

    data_to_send = {
        "FirstName": firstName,
        "LastName": lastName,
        "phoneNumber": phoneNumber,
        "email": email,
        "ai_response": ai_response,
        "transcript": transcript,
        "summary": summary,
        "campaign": campaign,
        "clientSummary": client_summary,
        "New Actionable": new_data
    }
    
    message = send_data_to_n8n_and_log(data_to_send)
    print(message)

    db_payload = {
        "user_id": user_id,
        "admin_id": admin_id,
        "ai_response": ai_response,
        "transcript": transcript,
        "summary": summary,
        "clientSummary": client_summary
    }

    try:
        db_response = requests.post("https://database.epiphanyadvisor.com/addMeetings", json=db_payload)
        if db_response.status_code != 200:
            return jsonify({
                "error": "Failed to store meeting data in database",
                "details": db_response.text
            }), 500
    except Exception as e:
        return jsonify({
            "error": "Error calling database endpoint",
            "details": str(e)
        }), 500

    return jsonify({"summary": summary}), 200

@socketio.on('connect')
def handle_connect():
    logging.info("Client connected via WebSocket")
    emit('status', {'message': 'Connected to Real World Assistant'})

@socketio.on('disconnect')
def handle_disconnect():
    logging.info("Client disconnected")

if __name__ == "__main__":
    logging.info("Starting server on port 5000")
    socketio.run(app, host="0.0.0.0", port=5000, debug=False, allow_unsafe_werkzeug=True)
