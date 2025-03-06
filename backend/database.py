from flask import Flask, jsonify, request, session
from flask_mysqldb import MySQL
import os
from flask_cors import CORS
import openai
from llm import generate_pre_meeting_questions
from flask_session import Session

# openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config["SECRET_KEY"] = "abcdef"
app.config['SESSION_TYPE'] = 'filesystem'

# app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
# app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
# app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'root')
# app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'AIMeetingAssistant_DB')

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'ec2-3-14-253-21.us-east-2.compute.amazonaws.com')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'AMA')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'Root1234$')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'AIMeetingAssistant_DB')

mysql = MySQL(app)

campaign_values = []
userID = 0
name = ""

@app.route('/test-db', methods=['GET'])
def test_db():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        return jsonify({"message": "Database connection successful", "result": result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getAdvisors', methods=['GET'])
def getAdvisors():
    try:
        cursor = mysql.connection.cursor()
        query = "SELECT username FROM User WHERE role = %s"
        cursor.execute(query, ("advisor",))
        names = cursor.fetchall()
        cursor.close()

        advisor_names = [row[0] for row in names]
        
        return jsonify(advisor_names)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/admin/login', methods=['POST'])
def user_login():
    global name, userID
    try:
        data = request.json
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({"error": "Missing username or password"}), 400

        username = data['username']
        password = data['password']
        role = data['role']

        name = username
        
        cursor = mysql.connection.cursor()
        query = "SELECT id, email FROM User WHERE username = %s AND password = %s AND role = %s" 
        cursor.execute(query, (username, password, role))
        user_record = cursor.fetchone()
        cursor.close()

        if user_record:
            user_id, email = user_record[0], user_record[1]
            # # Check that role is either advisor or manager
            # if getRole == role:
            #     return jsonify({"error": "User is not authorized"}), 403
            # # Store user details in session if needed
            userID = user_id
            return jsonify({
                "message": "Login successful",
                "name":username,
                "user_id": user_id,
                "role": role,
                "email": email
            }), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/scheduled_meetings', methods=['GET'])
def get_scheduled_meetings():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM Users u JOIN Meetings m ON u.id = m.user_id WHERE m.meeting_status = 'scheduled'")
    data = cur.fetchall()
    cur.close()
    return jsonify(data)

@app.route('/completed_meetings', methods=['GET'])
def get_completed_meetings():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM Users u JOIN Meetings m ON u.id = m.user_id WHERE m.meeting_status = 'completed'")
    data = cur.fetchall()
    cur.close()
    return jsonify(data)

@app.route('/users', methods=['POST'])
def add_user():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        # Personal Information
        personal = data.get('personalInformation')
        if not personal or 'firstName' not in personal or 'lastName' not in personal or 'dob' not in personal:
            return jsonify({"error": "Missing required personal details (firstName, lastName, dob)"}), 400

        # Contact Information
        contact = data.get('contactInformation')
        if not contact or 'homeAddress' not in contact or 'city' not in contact or \
           'state' not in contact or 'zipCode' not in contact or \
           'cellPhoneClient' not in contact or 'emailClient' not in contact:
            return jsonify({"error": "Missing required contact details"}), 400

        # Extract values from the payload
        first_name = personal.get('firstName')
        last_name = personal.get('lastName')
        dob = personal.get('dob')

        spouse = data.get('spouseInformation', {})
        spouse_first_name = spouse.get('firstName')
        spouse_last_name = spouse.get('lastName')
        spouse_dob = spouse.get('dob') or None

        home_address = contact.get('homeAddress')
        city = contact.get('city')
        state_name = contact.get('state')
        zip_code = contact.get('zipCode')
        cell_phone_client = contact.get('cellPhoneClient')
        email_client = contact.get('emailClient')
        cell_phone_spouse = contact.get('cellPhoneSpouse') or None
        email_spouse = contact.get('emailSpouse') or None

        family = data.get('familyInformation', {})
        children_names = family.get('childrenNames') or None
        num_grandchildren = family.get('numGrandchildren', 0)

        campaign = data.get('campaignTypes', {})
        medicare = int(bool(campaign.get('medicare', False)))
        life_insurance = int(bool(campaign.get('lifeInsurance', False)))
        wealth_planning = int(bool(campaign.get('wealthPlanning', False)))
        long_term_care_planning = int(bool(campaign.get('longTermCarePlanning', False)))

        # Advisor selection from payload
        advisor_name = data.get('advisorName', None)

        cursor = mysql.connection.cursor()
        query = """
            INSERT INTO clientRequests (
                clientFirstName, clientLastName, clientDOB,
                spouseFirstName, spouseLastName, spouseDOB,
                address, city, state, zipCode,
                clientPhone, clientEmail, spousePhone, spouseEmail,
                childrenNames, grandChildren,
                medicare, lifeInsurance, wealthPlanning, LTC_Planning,
                advisor
            ) VALUES (
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s,
                %s, %s, %s, %s,
                %s
            )
        """
        cursor.execute(query, (
            first_name, last_name, dob,
            spouse_first_name, spouse_last_name, spouse_dob,
            home_address, city, state_name, zip_code,
            cell_phone_client, email_client, cell_phone_spouse, email_spouse,
            children_names, num_grandchildren,
            medicare, life_insurance, wealth_planning, long_term_care_planning,
            advisor_name
        ))
        mysql.connection.commit()
        user_id = cursor.lastrowid
        cursor.close()

        return jsonify({"message": "User added successfully", "user_id": user_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/addMeetings', methods=['POST'])
def add_meeting():
    try:
        data = request.json
        if not data or 'user_id' not in data:
            return jsonify({"error": "Missing user_id in request data"}), 400

        user_id = data.get('user_id')
        admin_id = data.get('admin_id')
        transcript = data.get('transcript')
        ai_response = data.get('ai_response')
        summary = data.get('summary')
        
        cursor = mysql.connection.cursor()
        query = """
            INSERT INTO Meetings (user_id, admin_id, transcript, ai_response, summary, meeting_status)
            VALUES (%s, %s, %s, %s, %s, 'completed')
        """
        cursor.execute(query, (user_id, admin_id, transcript, ai_response, summary))
        mysql.connection.commit()
        meeting_id = cursor.lastrowid
        cursor.close()

        second = mysql.connection.cursor()
        update_query = "UPDATE clientRequests SET status = 'completed' WHERE id = %s"
        second.execute(update_query, (user_id,))
        mysql.connection.commit()
        
        second.close()
        
        return jsonify({"message": "Meeting Details added successfully", "meeting_id": meeting_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/preMeetingQuestions/<int:user_id>', methods=['GET'])
def preMeetingQuestions(user_id):
    try:
        cursor = mysql.connection.cursor()
        query = """
            SELECT clientFirstName, clientLastName,
                   medicare, lifeInsurance, wealthPlanning, LTC_Planning
            FROM clientRequests
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            return jsonify({"error": "User not found"}), 404

        first_name, last_name, medicare, life_ins, wealth, ltc = row

        # Build a list of campaigns set to 1
        campaigns = []
        if medicare == 1:
            campaigns.append("Medicare")
        if life_ins == 1:
            campaigns.append("Life Insurance")
        if wealth == 1:
            campaigns.append("Wealth Planning")
        if ltc == 1:
            campaigns.append("Long-Term Care Planning")

        questions = generate_pre_meeting_questions(first_name, last_name, campaigns)

        # return jsonify({"questions": questions}), 200
        return questions
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# using to get campaign of active user (whose conversation going to start)
@app.route('/campaign/<int:user_id>', methods=['GET'])
def get_campaign_by_user(user_id):
    global campaign_values
    campaign_values.clear()

    try:
        cursor = mysql.connection.cursor()
        query = """
            SELECT medicare, lifeInsurance, wealthPlanning, LTC_Planning
            FROM clientRequests
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        row = cursor.fetchone()
        cursor.close()

        if row is None:
            return jsonify({"error": f"No campaign data found for user id {user_id}"}), 404

        medicare, life_insurance, wealth_planning, ltc_planning = row

        if medicare == 1:
            campaign_values.append("Medicare")
        if life_insurance == 1:
            campaign_values.append("Life Insurance")
        if wealth_planning == 1:
            campaign_values.append("Wealth Planning")
        if ltc_planning == 1:
            campaign_values.append("Long Term Care Planning")

        return jsonify({"campaigns": campaign_values}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# get campaign for prompt
@app.route('/get_campaign', methods=['GET'])
def get_campaign():

    return jsonify({"campaign": campaign_values})


@app.route('/advisor/clients', methods=['GET'])
def get_clients_for_logged_in_advisor():
    global name
    try:
        if not name:
            return jsonify({"error": "Advisor not logged in"}), 403

        cursor = mysql.connection.cursor()
        query = "SELECT * FROM clientRequests WHERE advisor = %s AND status = %s"
        cursor.execute(query, (name,"scheduled"))
        data = cursor.fetchall()

        # Get column names from cursor description
        columns = [desc[0] for desc in cursor.description]
        clients = [dict(zip(columns, row)) for row in data]

        cursor.close()

        if clients:
            return jsonify(clients), 200
        else:
            return jsonify({"message": f"No clients found for advisor '{name}'"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/advisor/clientsPrevious', methods=['GET'])
def get_clients_previous():
    global name
    try:
        if not name:
            return jsonify({"error": "Advisor not logged in"}), 403

        cursor = mysql.connection.cursor()
        query = "SELECT * FROM clientRequests WHERE advisor = %s AND status = %s"
        cursor.execute(query, (name,"completed"))
        data = cursor.fetchall()

        # Get column names from cursor description
        columns = [desc[0] for desc in cursor.description]
        clients = [dict(zip(columns, row)) for row in data]

        cursor.close()

        if clients:
            return jsonify(clients), 200
        else:
            return jsonify({"message": f"No clients found for advisor '{name}'"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/clientRequests/<int:user_id>/preMeetingQuestions', methods=['POST'])
def store_pre_meeting_questions(user_id):
    try:
        data = request.json
        if not data or 'preMeetingQuestions' not in data:
            return jsonify({"error": "Missing preMeetingQuestions in request data"}), 400

        pre_meeting_questions = data['preMeetingQuestions']
        if isinstance(pre_meeting_questions, list):
            pre_meeting_questions = "\n".join(pre_meeting_questions)

        cursor = mysql.connection.cursor()
        query = "UPDATE clientRequests SET preMeetingQ = %s WHERE id = %s"
        cursor.execute(query, (pre_meeting_questions, user_id))
        mysql.connection.commit()
        cursor.close()

        return jsonify({"message": "Pre meeting questions stored successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/advisor/meetings/count/<string:advisor_name>', methods=['GET'])
def get_meeting_counts(advisor_name):
    try:
        cursor = mysql.connection.cursor()
        
        query_scheduled = """
            SELECT COUNT(*) FROM clientRequests 
            WHERE advisor = %s AND status = 'scheduled'
        """
        cursor.execute(query_scheduled, (advisor_name,))
        scheduled_count = cursor.fetchone()[0]
        
        query_completed = """
            SELECT COUNT(*) FROM clientRequests 
            WHERE advisor = %s AND status = 'completed'
        """
        cursor.execute(query_completed, (advisor_name,))
        completed_count = cursor.fetchone()[0]
        
        cursor.close()
        
        return jsonify({
            "advisor": advisor_name,
            "scheduled_meetings": scheduled_count,
            "completed_meetings": completed_count
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/getPreQ/<int:user_id>',methods=['GET'])
def getPerQ(user_id):
    try:
        if not user_id:
            return jsonify({"error": "Advisor not logged in"}), 403

        cursor = mysql.connection.cursor()
        query = "SELECT preMeetingQ FROM clientRequests WHERE id = %s"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        cursor.close()
        if result and result[0]:
            pre_meeting_questions = result[0]
            return jsonify({"preMeetingQ": pre_meeting_questions}), 200
        else:
            return jsonify({"message": "No pre-meeting questions found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/getSummary/<int:user_id>',methods=['GET'])
def getSummary(user_id):
    try:
        if not user_id:
            return jsonify({"error": "Advisor not logged in"}), 403

        cursor = mysql.connection.cursor()
        query = "SELECT summary FROM Meetings WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        cursor.close()
        if result and result[0]:
            summary = result[0]
            return jsonify({"summary": summary}), 200
        else:
            return jsonify({"message": "No summary found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========For manager Role 

@app.route('/getAllAdvisors', methods=['GET'])
def get_AllAdvisors():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM User WHERE role = 'advisor'")
    data = cur.fetchall()
    cur.close()
    return jsonify(data)

@app.route('/addAdvisor', methods=['POST'])
def add_Advisors():
    data = request.json
    name = data.get("username")
    password = data.get("password")
    email = data.get("email")
    
    if not name or not password or not email:
        return jsonify({"error": "Missing username, password, or email"}), 400

    try:
        cursor = mysql.connection.cursor()
        query = "INSERT INTO User (username, password, email, role) VALUES (%s, %s, %s, 'advisor')"
        cursor.execute(query, (name, password, email))
        mysql.connection.commit()
        advisor_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({"message": "Advisor added successfully", "advisor_id": advisor_id}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/editAdvisorByID/<int:user_id>', methods=['POST'])
def edit_advisor_by_id(user_id):
    data = request.json
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if (username is None or username.strip() == "") and \
       (password is None or password.strip() == "") and \
       (email is None or email.strip() == ""):
        return jsonify({"error": "No fields provided to update"}), 400

    try:
        cursor = mysql.connection.cursor()
        update_fields = []
        params = []

        if username is not None and username.strip() != "":
            update_fields.append("username = %s")
            params.append(username)
        if password is not None and password.strip() != "":
            update_fields.append("password = %s")
            params.append(password)
        if email is not None and email.strip() != "":
            update_fields.append("email = %s")
            params.append(email)

        params.append(user_id)
        
        query = "UPDATE User SET " + ", ".join(update_fields) + " WHERE id = %s AND role = 'advisor'"
        cursor.execute(query, tuple(params))
        mysql.connection.commit()
        affected = cursor.rowcount
        cursor.close()

        if affected == 0:
            return jsonify({"error": "Advisor not found or no changes made"}), 404

        return jsonify({"message": "Advisor updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/deleteAdvisor', methods=['POST'])
def delete_advisor():
    try:
        data = request.json
        id = data.get("id")
        cursor = mysql.connection.cursor()
        query = "DELETE FROM User WHERE id = %s AND role = 'advisor'"
        cursor.execute(query, (id,))
        mysql.connection.commit()
        affected = cursor.rowcount
        cursor.close()

        if affected == 0:
            return jsonify({"error": "Advisor not found"}), 404

        return jsonify({"message": "Advisor deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0",port=4000)
