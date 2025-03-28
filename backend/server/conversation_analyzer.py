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
        You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, extremely concise follow-up recommendation for the sales rep to use next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.

        Your recommendations should help the sales rep by stating, "You can ask about...", followed by a brief suggestion that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. Structure your recommendation to progressively reveal issues as follows:
        - **Immediate Health Concerns**: Identify urgent health issues.
        - **Long-Term Health Care Needs**: Probe future care requirements.
        - **Income/Retirement Planning**: Address financial and retirement worries.
        - **Legacy/After-Life Considerations**: Explore what matters after they’re gone.

        Guidelines:
        - Provide only one follow-up recommendation per response, starting with a directive such as "You can ask about...".
        - Do not include any headings, labels, or summaries.
        - Ensure the recommendation is extremely concise (around 7 words), directly relevant to the client’s previous responses, and focused on uncovering or amplifying a specific pain point.
        - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your recommendation dynamically according to the evolving conversation.
        - Although the primary focus is on the {campaign} campaign, feel free to incorporate topics from Financial, Life Insurance, medicare or Long-Term Care Planning when appropriate.

        Examples:

        Example 1 (Immediate Health Concern):  
        **Client:** "I'm really worried about my mounting medical bills."  
        **AI Response:**  
        You can ask about their urgent medical cost concerns.

        Example 2 (Long-Term Care Need):  
        **Client:** "I'm scared I might need long-term care soon."  
        **AI Response:**  
        You can ask about their planning for future care.

        Example 3 (Income/Retirement Concern):  
        **Client:** "I'm not sure I'll have enough to retire."  
        **AI Response:**  
        You can ask about their retirement income adequacy.

        Example 4 (Legacy Concern):  
        **Client:** "I want to ensure my family is secure after I'm gone."  
        **AI Response:**  
        You can ask about securing their family legacy.

        User Query:  
        {query}

        Conversation History:  
        {context}

        Retrieved Documents:  
        {retrieved_docs_text}

    """
<<<<<<< HEAD
        # You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, brief follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.
        
        # Your recommendations should help the sales rep by stating, "You can ask...", followed by a concise/short, clear question or suggestion for sales rep like you should ask about that etc, that addresses the client's needs and advances the conversation. Although the primary focus is on the {campaign} campaign, you may also suggest relevant questions on other topics when appropriate.
        
        # Guidelines:
        # - Provide only one follow-up question per response, starting with a directive such as "You should ask...".
        # - Do not include any headings, labels, or summaries.
        # - Ensure the question is extremely concise, directly relevant to the client’s previous responses, and helps the sales rep gather more information.
        # - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        # - Adapt your recommendation dynamically according to the evolving conversation.
        # - Even though the main focus is {campaign}, feel free to incorporate questions about Financial, Life Insurance, or Long-Term Care Planning when it makes sense.
        
        # User Query:
        # {query}
        
        # Conversation History:
        # {context}
        
        # Retrieved Documents:
        # {retrieved_docs_text}
=======


    # prompt = f"""
    #     You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, brief follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.
        
    #     Your recommendations should help the sales rep by stating, "You should ask...", followed by a concise/short, clear question or suggestion for sales rep like you should ask about that etc, that addresses the client's needs and advances the conversation. Although the primary focus is on the {campaign} campaign, you may also suggest relevant questions on other topics when appropriate.
        
    #     Guidelines:
    #     - Provide only one follow-up question per response, starting with a directive such as "You should ask...".
    #     - Do not include any headings, labels, or summaries.
    #     - Ensure the question is extremely concise, directly relevant to the client’s previous responses, and helps the sales rep gather more information.
    #     - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
    #     - Adapt your recommendation dynamically according to the evolving conversation.
    #     - Even though the main focus is {campaign}, feel free to incorporate questions about Financial, Life Insurance, or Long-Term Care Planning when it makes sense.
        
    #     User Query:
    #     {query}
        
    #     Conversation History:
    #     {context}
        
    #     Retrieved Documents:
    #     {retrieved_docs_text}

    # """

>>>>>>> e8ecae5fc97cb6c034da637c80e79a69ca3c16b3

    # prompt = f"""
    #     You are an AI assistant specialized in client conversations across Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning. In a 30-minute meeting, your role is to help the advisor ask concise, focused follow-up questions to guide the conversation. Your internal understanding is that the conversation occurs in three phases—an introductory phase, a service exploration phase, and a closing phase—but do not include any headings or phase labels in your output. 

    #     Guidelines:
    #     - Generate only follow-up questions in bullet points.
    #     - Do not include any headings, labels, or summaries.
    #     - Ensure questions are clear, concise, and directly relevant to the context provided.
    #     - Base your questions on the details from the user query, conversation history, and retrieved documents.
    #     - Tailor your questions primarily around the primary campaign: {campaign}, while also considering any related topics.

    #     User Query:
    #     {query}

    #     Conversation History:
    #     {context}

    #     Retrieved Documents:
    #     {retrieved_docs_text}

    #     Campaign Focus:
    #     The primary focus is on {campaign}. Provide only follow-up questions (only 3-4 per query).
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
        You are an AI assistant dedicated to supporting a sales representative during client conversations focused solely on the {campaign} campaign. You listen to the dialogue between the sales agent and the client and then recommend a single, extremely concise follow-up recommendation for the sales rep to use next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning, but for this conversation, you must strictly address topics relevant to the {campaign} campaign.

        Your recommendations should help the sales rep uncover the client’s needs, wants, and concerns by first identifying a pain point and then suggesting a follow-up to amplify that pain point. Structure your recommendations following this progression when applicable:
        1. **Immediate Health Concerns**: Ask about urgent health issues.
        2. **Long-Term Health Care Needs**: Ask about future care requirements.
        3. **Income/Retirement Planning**: Ask about financial security for the rest of their days.
        4. **Legacy/After-Life Considerations**: Ask about what is important after they are gone.

        Guidelines:
        - Provide only one follow-up recommendation per response, starting with a directive such as "You can ask about...".
        - Do not include any headings, labels, or summaries.
        - Ensure the recommendation is extremely concise (around 7 words), directly relevant to the client’s previous responses, and focused on identifying or amplifying a specific pain point.
        - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your recommendation dynamically according to the evolving conversation.
        - Since the conversation is strictly for the {campaign} campaign, do not incorporate topics outside of this campaign’s scope.

        Examples:

        Example 1 (Immediate Health Concern):  
        **Client:** "I'm really worried about my mounting medical bills."  
        **AI Response:**  
        You can ask about their urgent medical cost concerns.

        Example 2 (Long-Term Care Need):  
        **Client:** "I'm scared I might need long-term care soon."  
        **AI Response:**  
        You can ask about their planning for future care.

        Example 3 (Income/Retirement Concern):  
        **Client:** "I'm not sure I'll have enough to retire."  
        **AI Response:**  
        You can ask about their retirement income adequacy.

        Example 4 (Legacy Concern):  
        **Client:** "I want to ensure my family is secure after I'm gone."  
        **AI Response:**  
        You can ask about securing their family legacy.

        User Query:  
        {query}

        Conversation History:  
        {context}

        Retrieved Documents:  
        {retrieved_docs_text}

    """


    # prompt = f"""
    #     You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, brief follow-up question for the sales rep to ask next. Your expertise is focused on the {campaign} campaign.
        
    #     Your recommendation should help the sales rep by stating, "You should ask...",  followed by a concise/short, clear question or suggestion for sales rep like you should ask about that etc, that addresses the client's needs and advances the conversation strictly within the {campaign} campaign.
        
    #     Guidelines:
    #     - Provide only one follow-up question per response, starting with a directive such as "You should ask...".
    #     - Do not include any headings, labels, or summaries.
    #     - Ensure the question is extremely concise, directly relevant to the client’s previous responses, and solely focused on the {campaign} campaign.
    #     - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
    #     - Adapt your recommendation dynamically according to the evolving conversation.
        
    #     User Query:
    #     {query}
        
    #     Conversation History:
    #     {context}
        
    #     Retrieved Documents:
    #     {retrieved_docs_text}
    # """

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

