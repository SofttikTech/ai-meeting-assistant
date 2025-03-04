import openai
import os
import logging
import requests
from flask import jsonify
from dotenv import load_dotenv


load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = openai.OpenAI(api_key=api_key)

def generate_pre_meeting_questions(first_name, last_name, campaigns):
    user_info = f"Client Name: {first_name}."
    if campaigns:
        user_info += f" Campaign Interests: {', '.join(campaigns)}."
        query = f"Reterive questions about {campaigns[0]}"

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

    print(retrieved_docs_text)
    # Construct a prompt
    prompt = f"""Based on the following client's profile and retrieved documents:
    {user_info}
    Retrieved Documents:
    {retrieved_docs_text}

    Generate 10 personalized pre-meeting questions that a {campaigns} advisor should ask. 
    Focus on the client's goals, concerns, and any information needed to tailor financial advice.
    Give me questions in bullets in good format.
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are a medicare, life insurance, wealth planning and long term care planning assistant. Provide helpful, relevant questions."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
        max_tokens=300
    )

    generated_text = response.choices[0].message.content.strip()

    questions = generated_text.split("\n")  

    # questions = [line.strip("- ").strip() for line in generated_text.split("\n") if line.strip()]

    # formatted_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(questions))
    # print(formatted_text)
    
    cleaned_questions = []
    for q in questions:
        q = q.strip("- ").strip()
        if q and not q.isdigit():
            cleaned_questions.append(q)

    formatted_text = "\n".join(cleaned_questions)

    print(formatted_text)
    return jsonify({"questions": formatted_text}), 200
