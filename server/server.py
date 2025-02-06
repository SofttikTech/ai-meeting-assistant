import os
import random
from livekit import api # Load environment variables from .env file
from flask_cors import CORS
from dotenv import load_dotenv
from flask import Flask, jsonify, request, session, make_response, redirect, url_for
# ===
from flask_mysqldb import MySQL
from flask_session import Session
import json

load_dotenv('.env.local')

app = Flask(__name__)

CORS(app) # LiveKit API configuration
selected_card_number = None # LiveKit endpoint

LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
LIVEKIT_URL = os.getenv('LIVEKIT_URL') # Global variable for selected card number

# ===

app.config["SECRET_KEY"] = "abcdef"

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', '13.214.148.229')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'emotional')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'Haris111$')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'Emotional_DB')

mysql = MySQL(app)

# ===

# Define a route for the root URL
@app.route("/")
def home():
    return "Hello, Human!"

@app.route('/api/connection_details', methods=['GET'])
def get_token():
    try:
        participant_identity = f"voice_assistant_user_{random.randint(0, 10000)}"
        room_name = f'voice_assistant_room_{participant_identity}'        
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
        connection_details = {
            'serverUrl': LIVEKIT_URL,
            'roomName': room_name,
            'participantToken': jwt_token,
            'participantName': participant_identity,
        }        
        return jsonify(connection_details)
    except Exception as error:
        print('Error generating participant token:', error)
        return jsonify({'error': 'Failed to generate participant token'}), 500# Card selection endpoint

@app.route('/api/select-card', methods=['POST', 'GET'])
def select_card():
    global selected_card_number    
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'cardNumber' not in data:
                return jsonify({"error": "Invalid request: 'cardNumber' is required"}), 400            
            selected_card_number = data['cardNumber']
            print(f"Stored card number: {selected_card_number}")
            return jsonify({"cardNumber": selected_card_number, "message": "Card number stored successfully"}), 200        
        except Exception as e:
            return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500    
    elif request.method == 'GET':
        if selected_card_number is None:
            return jsonify({"error": "No card has been selected yet"}), 404
        return jsonify({"cardNumber": selected_card_number}), 200


# ===============Database API's==========================


# ===================== CHARACTERS API =====================

@app.route('/characters', methods=['GET'])
def get_characters():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM Characters")
        rows = cursor.fetchall()
        result = []
        for row in rows:
            result.append({
                "CharacterID": row[0],
                "CharacterName": row[1],
                "Voice_ID": row[2],
                "Age": row[3],
                "Country": row[4],
                "PicturePath": row[5]
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# # ===================== USERS API =====================

@app.route('/users', methods=['POST'])
def add_user():
    try:
        data = request.json
        if not data or not data.get('name'):
            return jsonify({"error": "Missing 'name' in request data"}), 400

        cursor = mysql.connection.cursor()
        query = "INSERT INTO Users (Name) VALUES (%s)"
        cursor.execute(query, (data['name'],))
        mysql.connection.commit()

        cursor.close()

        # delete previous data of temp Session/ you can say user
        cursor_delete = mysql.connection.cursor()

        delete_query = "TRUNCATE TABLE TempSession"
            
        cursor_delete.execute(delete_query)
        mysql.connection.commit()
            
        cursor_delete.close()

        return jsonify({"message": "User added successfully!"}), 201
    except KeyError as ke:
        return jsonify({"error": f"KeyError: {str(ke)}"}), 400
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({"error": "Internal Server Error"}), 500

# # ===================== SESSIONS API =====================

@app.route('/sessions', methods=['GET'])
def get_sessions():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM Sessions")
        rows = cursor.fetchall()
        result = [
            {"SessionID": row[0], "UserID": row[1], "CharacterID": row[2]}
            for row in rows
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/addsessions', methods=['POST'])
def add_session():
    try:
        data = request.json
        print(data)
        
        # Get the UserID based on UserName
        user_cursor = mysql.connection.cursor()
        user_query = "SELECT UserID FROM Users WHERE Name = %s"
        user_cursor.execute(user_query, (data['username'],))
        user = user_cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user[0]

        session['name'] = user_id
        user_cursor.close()
        
        # Get the CharacterID based on CharacterName
        char_cursor = mysql.connection.cursor()
        char_query = "SELECT CharacterID FROM Characters WHERE CharacterName = %s"
        char_cursor.execute(char_query, (data['CharacterName'],))
        character = char_cursor.fetchone()
        
        if not character:
            return jsonify({"error": "Character not found"}), 404
        
        character_id = character[0]

        char_cursor.close()
        
        # Insert into Sessions table with the retrieved UserID and CharacterID
        session_cursor = mysql.connection.cursor()
        session_query = "INSERT INTO Sessions (UserID, CharacterID) VALUES (%s, %s)"
        session_cursor.execute(session_query, (user_id, character_id))
        mysql.connection.commit()

        session_id = session_cursor.lastrowid

        session_cursor.close()

        print(session_id)

        # delete previous data of temp Session
        # cursor_delete = mysql.connection.cursor()

        # delete_query = "TRUNCATE TABLE TempSession"
            
        # cursor_delete.execute(delete_query)
        # mysql.connection.commit()
            
        # cursor_delete.close()

        # store new session_id temprary
        cursor = mysql.connection.cursor()
        query = "INSERT INTO TempSession VALUES (%s)"
        cursor.execute(query, (session_id,))
        mysql.connection.commit()
        cursor.close()

        # session['session_id'] = session_id
        # print(session.get('session_id'))
        # print(session['session_id'])
        # print(f"Session ID generated: {session_id}")
        # resp = make_response("sett cokkie")
        # resp.set_cookie('userID', session_id)

        return jsonify({"message": "Session added successfully!"}), 201
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

# # ===================== MESSAGES API =====================

@app.route('/messages', methods=['GET'])
def get_messages():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM Messages")
        rows = cursor.fetchall()
        result = [
            {
                "MessageID": row[0],
                "SessionID": row[1],
                "Sender": row[2],
                "Message": row[3]
            }
            for row in rows
        ]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/addmessages', methods=['POST'])
def add_message():
    try:
        data1 = request.json
        print(data1)
        name = data1['message'][29:34]
        msg = data1['message'][35:]

        print(name)
        print(msg)
        # session_id = session.get('session_id')
        # name = session.get('name')

        try:
            cursor = mysql.connection.cursor()
            query = "SELECT * FROM TempSession"
            cursor.execute(query)
            result = cursor.fetchone()
            session_id = result[0]

            insert_query = "INSERT INTO Messages (SessionID, Sender, Message) VALUES (%s, %s, %s)"
            cursor.execute(insert_query, (session_id, name, msg))
            mysql.connection.commit()

            cursor.close()


            print("gett",session_id)

            return jsonify({"session_id": session_id}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        # print("id", session.get['session_id'])
        # print(name)
        # print("000")
        # print(msg)
        # print(session_id)
        # print(name)
        # print(g.session_id)
        # # name = request.cookies.get('userID')
        # print("name",name)
        # cursor = mysql.connection.cursor()
        # query = "INSERT INTO Messages (SessionID, Sender, Message) VALUES (%s, %s, %s)"
        # cursor.execute(query, (data['SessionID'], data['Sender'], data['Message']))
        # mysql.connection.commit()
        return jsonify({"message": "Message added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===================== Add Emotion and Tone =====================
@app.route('/updatesession', methods=['POST'])
def update_session():
    try:
        data = request.json

        emotion = data.get('Emotion')
        tone = data.get('Tone')
        print("Emotion", emotion)
        print("Tone", tone)

        try:
            print("Update session block")
            cursor = mysql.connection.cursor()
            query = "SELECT * FROM TempSession"
            cursor.execute(query)
            result = cursor.fetchone()
            session_id = result[0]

            query2 = "UPDATE Sessions SET Emotion = %s, Tone = %s WHERE SessionID = %s"
            cursor.execute(query2, (emotion, tone, session_id))
            mysql.connection.commit()

            cursor.close()
            print("get",session_id)

            return jsonify({"session_id": None}), 200
        
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return ""
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================GET User Name===========================
@app.route('/getusername', methods=['GET'])
def get_username():
    try:
        cursor = mysql.connection.cursor()

        query = "SELECT * FROM TempSession"
        cursor.execute(query)
        result = cursor.fetchone()
        session_id = result[0]

        query2 = """
            SELECT Users.Name
            FROM Users
            JOIN Sessions ON Users.UserID = Sessions.UserID
            WHERE Sessions.SessionID = %s
        """
        cursor.execute(query2, (session_id,))
        user_result = cursor.fetchone()

        if not user_result:
            return jsonify({"error": "No user found for the given SessionID"}), 404

        user_name = user_result[0]

        cursor.close()

        # Return the username
        return jsonify({"user_name": user_name}), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500



# ===================== RUN THE APP =====================

if __name__ == "__main__":
    # app.run(debug=True)
    app.run(port=4000)
    # app.run(host='ec2-13-214-148-229.ap-southeast-1.compute.amazonaws.com', port=443)

