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
from difflib import SequenceMatcher
import openai
from typing import List, Dict
import re


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
pending_follow_ups = {}


def update_conversation_history(new_transcript):
    global conversation_history
    conversation_history.append(new_transcript)
    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)


def parse_ai_response(raw_text: str) -> dict:
    cleaned = re.sub(r'^\s*```?json\s*', '', raw_text)   
    cleaned = re.sub(r'```$', '', cleaned, flags=re.MULTILINE)  
    cleaned = cleaned.strip()
    if cleaned.endswith('?'):
        cleaned = cleaned[:-1].strip()

    cleaned = cleaned.replace('**', '')
    cleaned = re.sub(r'"\s*\n\s*', '"', cleaned)

    # 3) Parse
    return json.loads(cleaned)

def check_questions_in_transcript(transcript, questions):
    system_message = {
        "role": "system",
        "content": """ 
            You are an assistant that determines whether specific questions appear
            in a conversation transcript. Reply with a JSON object where keys are
            the original questions and values are 'Yes' or 'No'.
        """
    }

    user_message = {
        "role": "user",
        "content": (
            f"Transcript:\n```\n{transcript}\n```\n\n"
            f"Questions:\n{questions}\n\n"
            "For each, respond 'Yes' if it was asked, otherwise 'No'."
        )
    }

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[system_message, user_message],
        temperature=0
    )

    print("Responses questions: ",response.choices[0].message.content)
    parsed = parse_ai_response(response.choices[0].message.content)
    # result = json.loads(response.choices[0].message.content)
    # return {q: (result.get(q, "No") == "Yes") for q in questions}
    return parsed


def extract_new_transcript_chunk(old_transcript, full_transcript):
    """
    Compare `old_transcript` (already processed) with 
    `full_transcript` (Deepgram's latest full output) and return 
    only the newly added portion as plain text. If nothing new, returns "".
    """
    prompt = f"""
        OLD TRANSCRIPT (already processed):
        ```
        {old_transcript}
        ```

        FULL TRANSCRIPT (old + new speech):
        ```
        {full_transcript}
        ```

       Return only the text in FULL TRANSCRIPT that comes after the OLD TRANSCRIPT.  
        - No repeats, no commentary, no extra formatting.  
        - If there is no new text, return an empty string.
    """

    response = openai.ChatCompletion.create(
        model="gpt-4.1",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a precise text differencer. "
                    "Your job is to find and return only the delta between two versions of a transcript."
                )
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
    )

    return response.choices[0].message.content



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
        email = request.form.get("email")
        messages =json.loads(raw)
        pending_follow_ups.setdefault(email, [])
        logging.info(f"Email: {email}")
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

            last_full_transcript = str(
                next(
                    (msg["content"] for msg in reversed(messages)
                    if msg.get("role") == "user"),
                    ""
                )
            )

            # print("last_full_transcript: ", last_full_transcript)
            # print("new Transcript:", transcript)

            # separate new transcript using LLM 
            new_chunk = extract_new_transcript_chunk(last_full_transcript, transcript)
            print("NEW CHUNK", new_chunk)

            # method without LLM
            # if transcript.startswith(last_full_transcript):
            #     new_chunk = transcript[len(last_full_transcript):].lstrip()
            # else:
            #     matcher = SequenceMatcher(None, last_full_transcript, transcript)
            #     match = matcher.find_longest_match(0, len(last_full_transcript), 0, len(transcript))
            #     if match.a == 0 and match.b == 0:
            #         new_chunk = transcript[match.size:].lstrip()
            #     else:
            #        new_chunk = transcript[len(last_full_transcript):].lstrip()

            if new_chunk.strip():
                if pending_follow_ups[email]:
                    res = check_questions_in_transcript(new_chunk, pending_follow_ups[email])
                    print("Questions Pending: ",res)
                    unanswered = [q for q, ans in res.items() if ans == "No"]
                    if unanswered:
                        nextQ = unanswered[0]
                        pending_follow_ups[email] = unanswered[1:]
                        socketio.emit('update', {'ai_response': {"type":"question","question":nextQ}, 'transcript': new_chunk, 'messages':messages})
                else:
                    messages.append({"role":"user","content":new_chunk})
                    print("Before sending: ", messages)
                    update_conversation_history(new_chunk)
                    
                    if meetingType == "In Place":
                        ai_response = analyze_conversation(new_chunk, messages.copy(), total_meeting_minutes, diff_minutes)
                        print("Response in Server: ",ai_response)
                    elif meetingType == "Telephonic":
                        ai_response = analyze_conversation_telephonic(transcript, messages.copy(), total_meeting_minutes, diff_minutes)

                    if ai_response['type']=="question":            
                        messages.append({"role":"assistant","content":ai_response['question']})
                    elif ai_response["type"]=="pain_point":
                        messages.append({"role":"assistant","content":ai_response['pain_point']})
                    elif ai_response["type"]=="recommendation":
                        messages.append({"role":"assistant","content":ai_response['recommendation']})

                    if ai_response["type"] in ("pain_point", "recommendation"):
                        pending_follow_ups[email] = ai_response["follow_up"].copy()

                    
                    print("Messages array: ",messages)

                    if ai_response:
                        # logging.info(f"AI Response: {ai_response[:50]}...")
                        socketio.emit('update', {'ai_response': ai_response, 'transcript': new_chunk, 'messages':messages})
            else:
                socketio.emit('update', {'ai_response': {'type': 'question', 'question': 'Tell me more about this?'}, 'transcript': "No Speech", 'messages':messages})

            return jsonify({"transcript": new_chunk})
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
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
# allow_unsafe_werkzeug=True