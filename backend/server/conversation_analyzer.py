import os
import logging
import requests
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

logging.basicConfig(level=logging.DEBUG)

campaign = ""

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
        rag_url = "https://rag.epiphanyadvisor.com/query/"
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

    # campaign = ""
    try:
        res = requests.get("https://database.epiphanyadvisor.com/get_campaign")
        if res.status_code == 200:
            data = res.json()
            campaign = data.get("campaign")
            print(campaign)
        else:
            campaign = "medicare"
    except Exception as e:
        logging.error(f"Error calling campaign endpoint: {e}")
        campaign = "medicare"

    prompt = f"""
        You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, brief follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.
        
        Your recommendations should help the sales rep by stating, "You should ask...", followed by a concise/short, clear question or suggestion for sales rep like you should ask about that etc, that addresses the client's needs and advances the conversation. Although the primary focus is on the {campaign} campaign, you may also suggest relevant questions on other topics when appropriate.
        
        Guidelines:
        - Provide only one follow-up question per response, starting with a directive such as "You should ask...".
        - Do not include any headings, labels, or summaries.
        - Ensure the question is extremely concise, directly relevant to the client’s previous responses, and helps the sales rep gather more information.
        - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your recommendation dynamically according to the evolving conversation.
        - Even though the main focus is {campaign}, feel free to incorporate questions about Financial, Life Insurance, or Long-Term Care Planning when it makes sense.
        
        User Query:
        {query}
        
        Conversation History:
        {context}
        
        Retrieved Documents:
        {retrieved_docs_text}

    """


    # prompt = f"""
    #     You are an AI assistant specialized in analyzing discussions across multiple areas: Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning. Your goal is to support the advisor during client conversations by providing analysis that covers both the primary campaign focus ({campaign}) and any other related topics that emerge during the conversation.

    #     Identifying Key Discussion Topics:
    #     - Recognize and summarize concerns such as healthcare needs, long-term care planning, retirement, estate planning, and legacy issues.
    #     - Note financial pain points like high healthcare costs, inadequate insurance coverage, or investment risks.
    #     - Highlight positive actions like policy purchases or successful investments.
    #     - While the primary focus is on {campaign}, also acknowledge if other campaign-related issues arise during the conversation.

    #     Generating Follow-Up Questions:
    #     - Based on the conversation history and the client's profile, suggest follow-up questions that help the advisor explore the client’s concerns related to {campaign} as well as other relevant topics (e.g., if aspects of Medicare or Life Insurance are mentioned, include follow-up questions for those areas).

    #     Relevance Filter:
    #     - Generate a response if there is any new or significant information regarding the client's financial, healthcare, or insurance needs, even if these cross over into areas outside the primary campaign ({campaign}). 

    #     Use the following context to generate your analysis:

    #     User Query:
    #     {query}

    #     Conversation History:
    #     {context}

    #     Retrieved Documents:
    #     {retrieved_docs_text}

    #     Campaign Focus:
    #     While the primary area of interest is {campaign}, provide insights and follow-up questions that also address other relevant campaigns if they emerge during the discussion.
    # """

    print("Inside In Place")

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


def analyze_conversation_telephonic(query, conversation_history):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""

    if query:
        # Calling RAG endpoint
        rag_url = "https://rag.epiphanyadvisor.com/query/"
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

    # campaign = ""
    try:
        res = requests.get("https://database.epiphanyadvisor.com/get_campaign")
        if res.status_code == 200:
            data = res.json()
            campaign = data.get("campaign")
            print(campaign)
        else:
            campaign = "medicare"
    except Exception as e:
        logging.error(f"Error calling campaign endpoint: {e}")
        campaign = "medicare"

    prompt = f"""
        You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, brief follow-up question for the sales rep to ask next. Your expertise is focused on the {campaign} campaign.
        
        Your recommendation should help the sales rep by stating, "You should ask...",  followed by a concise/short, clear question or suggestion for sales rep like you should ask about that etc, that addresses the client's needs and advances the conversation strictly within the {campaign} campaign.
        
        Guidelines:
        - Provide only one follow-up question per response, starting with a directive such as "You should ask...".
        - Do not include any headings, labels, or summaries.
        - Ensure the question is extremely concise, directly relevant to the client’s previous responses, and solely focused on the {campaign} campaign.
        - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your recommendation dynamically according to the evolving conversation.
        
        User Query:
        {query}
        
        Conversation History:
        {context}
        
        Retrieved Documents:
        {retrieved_docs_text}
    """

    # prompt = f"""
    #     You are an AI assistant specialized in analyzing discussions specifically related to the {campaign} campaign. Your goal is to support the advisor during client conversations by focusing solely on the issues relevant to {campaign}.

    #     Identifying Key Discussion Topics:
    #     - Recognize and summarize concerns and opportunities directly related to {campaign} such as [for example, if campaign is Wealth Planning: financial pain points like high healthcare costs, inadequate insurance coverage, or investment risks].
    #     - Highlight any positive actions (e.g., policy purchases or successful investments) that pertain to {campaign}.

    #     Generating Follow-Up Questions:
    #     - Based on the conversation history and the client's profile, suggest follow-up questions that help the advisor probe further into {campaign}-related concerns or confirm signals pertinent to this campaign.

    #     Relevance Filter:
    #     - Only generate a response if there is new or significant information directly related to {campaign}. Do not produce unnecessary output if no relevant topics emerge.

    #     Use the following context to generate your analysis:

    #     User Query:
    #     {query}

    #     Conversation History:
    #     {context}

    #     Retrieved Documents:
    #     {retrieved_docs_text}

    #     Campaign Focus:
    #     The discussion should be analyzed exclusively with regard to {campaign}. Provide insights, identify specific concerns, and suggest tailored follow-up questions that are strictly related to {campaign}.
    # """

    print("Inside telephonic")
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

def generate_client_meeting_summary(conversation_history):
    context = "\n".join(conversation_history)

    prompt = f"""
    Based on the previous discussion, generate a **client-friendly post-meeting summary**.
    This should be clear, simple, and easy for the client to understand, focusing on their needs and the action steps ahead. The summary should include:

    1. **Meeting Recap:** A brief overview of the main points discussed in the meeting.
    2. **Actionable Next Steps:** Clear, actionable steps that the client should take.
    3. **Key Takeaways:** Important notes or reminders for the client to consider.

    **Conversation History:**
    {context}

    Format the response as:
    - **Meeting Recap:**
    - ...  
    - ...  
    - **Actionable Next Steps:**
    1. ...  
    2. ...  
    3. ...  
    - **Key Takeaways:**
    1. ...  
    2. ...  
    3. ...  
    """

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert in summarizing meetings for clients, with a focus on clear communication and actionable next steps."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )

    summary = response["choices"][0]["message"]["content"].strip()
    return summary

def find_additional_campaign_interests(conversation_history):
    context = "\n".join(conversation_history)
    
    prompt = f"""
    You are a strategic advisor specialized in financial and healthcare planning. Your task is to analyze a client's conversation and identify any topics discussed that are different from the primary campaign focus which is {campaign}. The primary campaign focus of the meeting is "{campaign}".

    The available campaign topics are:
    1. Medicare
    2. Life Insurance
    3. Wealth Planning
    4. Long-Term Care Planning

    For each additional topic (i.e., a campaign topic other than "{campaign}") that the client discusses, return:
    - **Task Name:** The name of the additional topic other than the primary topic fo campaign {campaign}.
    - **Task Description:** A concise explanation of the discussion or concern related to that topic (additional topic) as derived from the conversation.
    Only return me this for the aditional topic, don't return me the Task name and description for the topic "{campaign}".

    If no additional topics other than {campaign} topic, return empty response.

    Conversation History:
    {context}
    """

    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a strategic advisor who analyzes client conversations to identify cross-campaign interests."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    result = response["choices"][0]["message"]["content"].strip()
    print(result)
    return result

