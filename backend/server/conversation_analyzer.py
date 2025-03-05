import os
import logging
import requests
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

logging.basicConfig(level=logging.DEBUG)

# MAX_HISTORY = 10
# conversation_history = []

# def update_conversation_history(new_transcript):
#     """Update conversation history and ensure it doesn't exceed the max limit."""
#     global conversation_history
#     conversation_history.append(new_transcript)

#     if len(conversation_history) > MAX_HISTORY:
#         conversation_history.pop(0)

def analyze_conversation(query, conversation_history):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""

    if query:
        # Calling RAG endpoint
        rag_url = "http://3.146.37.52:8000/query/"
        rag_payload = {"query": query}
        try:
            rag_response = requests.post(rag_url, json=rag_payload)
            if rag_response.status_code == 200:
                rag_data = rag_response.json()
                results = rag_data.get("results", [])
                retrieved_docs_text = "\n\n".join([doc.get("content", "") for doc in results])
            else:
                retrieved_docs_text = "No documents retrieved."
        except Exception as e:
            logging.error(f"Error calling RAG endpoint: {e}")
            retrieved_docs_text = "Error retrieving documents."

    context = "\n".join(conversation_history)

    campaign = ""
    try:
        res = requests.get("http://3.146.37.52:4000/get_campaign")
        if res.status_code == 200:
            data = res.json()
            campaign = data.get("campaign")
            print(campaign)
        else:
            campaign = "medicare"
    except Exception as e:
        logging.error(f"Error calling campaign endpoint: {e}")
        campaign = "medicare"

    # Respond only if a relevant topic is mentioned. Otherwise, return "NO_ACTION".
    prompt = f"""
        You are an AI assistant specialized in analyzing four types of discussions: Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning. Your main goal is to support the advisor during client conversations by:

        Identifying Key Discussion Topics:
        Recognize and summarize concerns such as healthcare needs, long-term care planning, retirement, estate planning, and legacy issues; note financial pain points like high healthcare costs, inadequate insurance coverage, and investment risks; and highlight positive actions like policy purchases or successful investments.

        Generating Follow-Up Questions:
        Based on the conversation history and the client's profile, suggest relevant follow-up questions that help the advisor probe further into the client’s concerns or confirm positive signals.

        Tailoring Your Analysis to the Campaign Focus:
        The primary focus of this discussion is on {campaign}. Ensure that your analysis, insights, and follow-up questions are specifically tailored to address issues related to this campaign.

        Relevance Filter:
        Only generate a response if a relevant topic or concern emerges in the conversation. If the discussion does not include any new or significant information related to the client's financial, healthcare, or insurance needs, do not generate unnecessary output.

        Use the following context to generate your analysis:

        User Query:
        {query}

        Conversation History:
        {context}

        Retrieved Documents:
        {retrieved_docs_text}

        Campaign Focus:
        The primary topic of interest is {campaign}. 
        Based on this, analyze the conversation, identify concerns, highlight any financial or healthcare pain points, note positive actions, 
        and suggest appropriate follow-up questions and recommendations that the advisor can use to guide the conversation effectively.
    """


    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a professional assistant for financial and healthcare planning."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    result = response["choices"][0]["message"]["content"].strip()
    # return None if result == "NO_ACTION" else result
    return result

def generate_post_meeting_summary(conversation_history):
    context = "\n".join(conversation_history)

    prompt = f"""  
    Based on the previous discussion, generate a structured **post-meeting summary**.  
    This should include:  

    1. **Summary:** A concise overview of the key points discussed in the meeting.  
    2. **Follow-up Questions:** Identify key topics that need further clarification or discussion.  
    3. **Recommendations:** Provide actionable financial and healthcare planning advice.  

    **Conversation History:**  
    {context}  

    Format the response as:  
    - **Summary:**  
    - ...  
    - ...  
    - ...  
    - **Follow-up Questions:**  
    1. ...  
    2. ...  
    3. ...  
    - **Recommendations:**  
    1. ...  
    2. ...  
    3. ...  
    """  


    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert in financial and healthcare planning."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    summary = response["choices"][0]["message"]["content"].strip()
    return summary

