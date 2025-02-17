import os
import logging
import requests
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

logging.basicConfig(level=logging.DEBUG)

MAX_HISTORY = 10
conversation_history = []

def update_conversation_history(new_transcript):
    """Update conversation history and ensure it doesn't exceed the max limit."""
    global conversation_history
    conversation_history.append(new_transcript)

    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)

def analyze_conversation(query):
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

    # Respond only if a relevant topic is mentioned. Otherwise, return "NO_ACTION".
    prompt = f"""
    You are an AI assistant that analyzes financial and healthcare planning discussions.
    Your main goal is to analyze conversation and help the advisor like you can give a sort of questions related to 
    topic to the advisor that he will ask from user if you find any.
    Identify concerns related to:
    - Healthcare needs, long-term care planning, retirement, estate planning, legacy.
    - Financial pain points: high healthcare costs, inadequate insurance, investment risks.
    - Positive actions: policy purchases, successful investments.

    Below is the conversation history, a user query, and additional relevant documents retrieved for context.

    **User Query:**
    {query}

    **Conversation History:**
    {context}

    **Retrieved Documents:**
    {retrieved_docs_text}
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
