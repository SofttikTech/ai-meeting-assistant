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
        rag_url = "http://127.0.0.1:8000/query/"
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

    campaign = "medicare"

    # Respond only if a relevant topic is mentioned. Otherwise, return "NO_ACTION".
    prompt = f"""
    You are an AI assistant that analyzes financial and healthcare planning discussions.
    Your main goal is to analyze the conversation and assist the advisor by identifying key discussion topics. 
    You should also suggest relevant follow-up questions the advisor can ask the user.

    Identify concerns related to:
    - Healthcare needs, long-term care planning, retirement, estate planning, and legacy.
    - Financial pain points: high healthcare costs, inadequate insurance, investment risks.
    - Positive actions: policy purchases, successful investments.

    The primary focus of this discussion is on **{campaign}**. Consider this when analyzing the conversation and generating insights.

    Below is the conversation history, a user query, and additional relevant documents retrieved for context.

    **User Query:**
    {query}

    **Conversation History:**
    {context}

    **Retrieved Documents:**
    {retrieved_docs_text}

    **Campaign Focus:**
    The primary topic of interest is **{campaign}**, so tailor the analysis, follow-up questions, and recommendations accordingly.
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

