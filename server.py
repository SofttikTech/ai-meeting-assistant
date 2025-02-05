import os
import random
import time
# from datetime import datetime, timedelta
from livekit import api
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('.env.local')

app = Flask(__name__)
CORS(app)

# Environment variables
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
LIVEKIT_URL = os.getenv('LIVEKIT_URL')

@app.route('/api/connection_details', methods=['GET'])
def get_token():
    try:
        participant_identity = f"voice_assistant_user_{random.randint(0, 10000)}"
        room_name = 'voice_assistant_room'

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(participant_identity) \
            .with_name("Voice Assistant User") \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True
            ))

        jwt_token = token.to_jwt()

        # Connection details to return
        connection_details = {
            'serverUrl': LIVEKIT_URL,
            'roomName': room_name,
            'participantToken': jwt_token,
            'participantName': participant_identity,
        }

        return jsonify(connection_details)
    except Exception as error:
        print('Error generating participant token:', error)
        return jsonify({'error': 'Failed to generate participant token'}), 500

# Start the server
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    app.run(host='127.0.0.1', port=port)
