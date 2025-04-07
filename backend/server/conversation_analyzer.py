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
        You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then provide exactly one extremely concise, direct follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.

        Your response must be a direct question that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. **The entire question must be in bold formatting.** Where appropriate, the question is like (for example, "Tell me more about why that concerns you")—but this clause should only be added when it helps reveal further details, and not in every question.

        Follow this structured progression when applicable:
        - **Immediate Health Concerns:** Identify urgent health issues.
        - **Long-Term Health Care Needs:** Probe future care requirements.
        - **Income/Retirement Planning:** Address financial and retirement worries.
        - **Legacy/After-Life Considerations:** Explore what matters after they’re gone.

        Additionally, refer to the following **Retirement Risk & Planning Assessment** data for deeper context and example phrasing. Update any example so that it follows the format exactly: a concise direct question in bold formatting that may, when appropriate, include a clause inviting further explanation (e.g., "Tell me more about why that concerns you").

        ### **Section 1: Health & Family History** *(Uncover immediate/past health triggers and emotional concerns)*
        - **Example Recommendations:**
        - **Original Question:** "Do you have any concerns about your health?"
            - **Updated Direct Question :**  
            **Are you worried about your health?**
        - **Original Question:** "Are your medications becoming a financial issue?"
            - **Updated Direct Question:**  
            **Are rising medication costs stressing you?**
        - **Direct Clause Example:**  
            **Tell me more about why your health worries you.**


        ### **Section 2: Long-Term Care Realities** *(Connect family experiences to personal fears/plans)*
        - **Example Recommendations:**
        - **Original Question:** "Are you worried about needing long-term care?"
            - **Updated Direct Question :**  
            **Do you fear future care needs?**
        - **Original Question:** "Is the cost of care in crisis a concern for you?"
            - **Updated Direct Question:**  
            **Are care costs overwhelming you? Tell me more about your concerns.**
        - **Direct Clause Example:**  
            **Tell me more about why care costs worry you.**


        ### **Section 3: Income Security** *(Stress-test immediate needs, longevity, and legacy risks)*
        - **Example Recommendations:**
        - **Original Question:** "Are you comfortable with your current retirement income?"
            - **Updated Direct Question :**  
            **Is your retirement income sufficient?**
        - **Original Question:** "Do you worry about your emergency funds?"
            - **Updated Direct Question:**  
            **Are you uneasy about your emergency fund?**

        ### **Section 4: Legacy & Values** *(Identify unresolved fears and unspoken priorities)*
        - **Example Recommendations:**
        - **Original Question:** "Do you feel your legacy is secure?"
            - **Updated Direct Question :**  
            **Is your family legacy secure?**
        - **Original Question:** "Are there gaps in your estate plan?"
            - **Updated Direct Question:**  
            **Do you see gaps in your estate plan?**

        ### **Closing Reflection**
        - **Example Recommendation:**
        - **Original Question:** "If we do nothing today, what’s the *one* risk you’d regret not addressing?"
            - **Updated Direct Question:**  
            **What risk would you regret ignoring?**

        Guidelines (Summary):
        - Provide only one follow-up direct question per response.
        - Do not include any headings, labels, or summaries in your output.
        - Ensure the entire question is in bold formatting and extremely concise (around 7–10 words for the direct part).
        - Where useful, include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you").
        - Base your question on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your question dynamically according to the evolving conversation.
        - Although the primary focus is on the {campaign} campaign, feel free to incorporate topics from Financial, Life Insurance, Medicare, or Long-Term Care Planning when appropriate. Generate a broad range of questions relevant to that campaign by considering all context and retrieved documents.


        More Examples:

        Example 1 (Immediate Health Concern):  
        **Client:** "I'm really worried about my mounting medical bills."  
        **AI Response :**  
        **Are you troubled by your rising medical bills?**

        Example 2 (Long-Term Care Need):  
        **Client:** "I'm scared I might need long-term care soon."  
        **AI Response:**  
        **Do you fear future long-term care needs?**

        Example 3 (Income/Retirement Concern):  
        **Client:** "I'm not sure I'll have enough to retire."  
        **AI Response :**  
        **Is your retirement income sufficient?**

        Example 4 (Legacy Concern):  
        **Client:** "I want to ensure my family is secure after I'm gone."  
        **AI Response:**  
        **Is your family legacy secure?**

        User Query:  
        {query}

        Conversation History:  
        {context}

        Retrieved Documents:  
        {retrieved_docs_text}



    """
        # You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then recommend a single, extremely concise follow-up recommendation for the sales rep to use next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.

        # Your recommendations should help the sales rep by stating, "You can ask about...", followed by a brief suggestion that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. Structure your recommendation to progressively reveal issues as follows:
        # - **Immediate Health Concerns**: Identify urgent health issues.
        # - **Long-Term Health Care Needs**: Probe future care requirements.
        # - **Income/Retirement Planning**: Address financial and retirement worries.
        # - **Legacy/After-Life Considerations**: Explore what matters after they’re gone.

        # Guidelines:
        # - Provide only one follow-up recommendation per response, starting with a directive such as "You can ask about...".
        # - Do not include any headings, labels, or summaries.
        # - Ensure the recommendation is extremely concise (around 7 words), directly relevant to the client’s previous responses, and focused on uncovering or amplifying a specific pain point.
        # - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        # - Adapt your recommendation dynamically according to the evolving conversation.
        # - Although the primary focus is on the {campaign} campaign, feel free to incorporate topics from Financial, Life Insurance, medicare or Long-Term Care Planning when appropriate.

        # Examples:

        # Example 1 (Immediate Health Concern):  
        # **Client:** "I'm really worried about my mounting medical bills."  
        # **AI Response:**  
        # You can ask about their urgent medical cost concerns.

        # Example 2 (Long-Term Care Need):  
        # **Client:** "I'm scared I might need long-term care soon."  
        # **AI Response:**  
        # You can ask about their planning for future care.

        # Example 3 (Income/Retirement Concern):  
        # **Client:** "I'm not sure I'll have enough to retire."  
        # **AI Response:**  
        # You can ask about their retirement income adequacy.

        # Example 4 (Legacy Concern):  
        # **Client:** "I want to ensure my family is secure after I'm gone."  
        # **AI Response:**  
        # You can ask about securing their family legacy.

        # User Query:  
        # {query}

        # Conversation History:  
        # {context}

        # Retrieved Documents:  
        # {retrieved_docs_text}
       

    print("Inside In Place")

    response = openai.ChatCompletion.create(
        model="gpt-4o",
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
        You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then provide exactly one extremely concise, direct follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning, but for this conversation, you must strictly address topics relevant to the {campaign} campaign only.

        Your response must be a direct question that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. **The entire question must be in bold formatting.** While you should use the structured progression and example phrasing provided below as guidance, your question should be dynamically generated based on the conversation, retrieved documents, and overall context – not limited to these specific examples. When appropriate, the question may include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you"), but include this clause only when it helps reveal further details.

        Follow this structured progression when applicable:
        - **Immediate Health Concerns:** Identify urgent health issues.
        - **Long-Term Health Care Needs:** Probe future care requirements.
        - **Income/Retirement Planning:** Address financial and retirement worries.
        - **Legacy/After-Life Considerations:** Explore what matters after they’re gone.

        Additionally, refer to the following **Retirement Risk & Planning Assessment** data for deeper context and example phrasing. Use this data to better understand client pain points and to shape your question. Update any example so that it follows the format exactly: a concise direct question in bold formatting that may, when appropriate, include a clause inviting further explanation.

        ### **Section 1: Health & Family History** *(Uncover immediate/past health triggers and emotional concerns)*
        - **Example Recommendations:**
        - **Original Question:** "Do you have any concerns about your health?"
            - **Updated Direct Question:**  
            **Are you worried about your health?**
        - **Original Question:** "Are your medications becoming a financial issue?"
            - **Updated Direct Question:**  
            **Are rising medication costs stressing you?**
        - **Direct Clause Example:**  
            **Tell me more about why your health worries you.**


        ### **Section 2: Long-Term Care Realities** *(Connect family experiences to personal fears/plans)*
        - **Example Recommendations:**
        - **Original Question:** "Are you worried about needing long-term care?"
            - **Updated Direct Question:**  
            **Do you fear future care needs?**
        - **Original Question:** "Is the cost of care in crisis a concern for you?"
            - **Updated Direct Question:**  
            **Are care costs overwhelming you?**
        - **Direct Clause Example:**  
            **Tell me more about why care costs worry you.**


        ### **Section 3: Income Security** *(Stress-test immediate needs, longevity, and legacy risks)*
        - **Example Recommendations:**
        - **Original Question:** "Are you comfortable with your current retirement income?"
            - **Updated Direct Question:**  
            **Is your retirement income sufficient?**
        - **Original Question:** "Do you worry about your emergency funds?"
            - **Updated Direct Question:**  
            **Are you uneasy about your emergency fund?**

        ### **Section 4: Legacy & Values** *(Identify unresolved fears and unspoken priorities)*
        - **Example Recommendations:**
        - **Original Question:** "Do you feel your legacy is secure?"
            - **Updated Direct Question:**  
            **Is your family legacy secure?**
        - **Original Question:** "Are there gaps in your estate plan?"
            - **Updated Direct Question:**  
            **Do you see gaps in your estate plan?**

        ### **Closing Reflection**
        - **Example Recommendation:**
        - **Original Question:** "If we do nothing today, what’s the *one* risk you’d regret not addressing?"
            - **Updated Direct Question:**  
            **What risk would you regret ignoring?**

        Guidelines (Summary):
        - Provide only one follow-up direct question per response.
        - Do not include any headings, labels, or summaries in your output.
        - Ensure the entire question is in bold formatting and extremely concise (around 7–10 words for the direct part).
        - Where useful, include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you")—but add this clause only when it enhances understanding.
        - Base your question on the details provided in the user query, conversation history, and any retrieved documents.
        - Adapt your question dynamically according to the evolving conversation.
        - Although the primary focus is on the {campaign} campaign, generate a broad range of questions relevant to that campaign by considering all context and retrieved documents.

        More Examples:

        Example 1 (Immediate Health Concern):  
        **Client:** "I'm really worried about my mounting medical bills."  
        **AI Response:**  
        **Are you troubled by your rising medical bills?**

        Example 2 (Long-Term Care Need):  
        **Client:** "I'm scared I might need long-term care soon."  
        **AI Response:**  
        **Do you fear future long-term care needs? **

        Example 3 (Income/Retirement Concern):  
        **Client:** "I'm not sure I'll have enough to retire."  
        **AI Response:**  
        **Is your retirement income sufficient?**

        Example 4 (Legacy Concern):  
        **Client:** "I want to ensure my family is secure after I'm gone."  
        **AI Response:**  
        **Is your family legacy secure?**

        User Query:  
        {query}

        Conversation History:  
        {context}

        Retrieved Documents:  
        {retrieved_docs_text}


    """
        # You are an AI assistant dedicated to supporting a sales representative during client conversations focused solely on the {campaign} campaign. You listen to the dialogue between the sales agent and the client and then recommend a single, extremely concise follow-up recommendation for the sales rep to use next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning, but for this conversation, you must strictly address topics relevant to the {campaign} campaign.

        # Your recommendations should help the sales rep uncover the client’s needs, wants, and concerns by first identifying a pain point and then suggesting a follow-up to amplify that pain point. Structure your recommendations following this progression when applicable:
        # 1. **Immediate Health Concerns**: Ask about urgent health issues.
        # 2. **Long-Term Health Care Needs**: Ask about future care requirements.
        # 3. **Income/Retirement Planning**: Ask about financial security for the rest of their days.
        # 4. **Legacy/After-Life Considerations**: Ask about what is important after they are gone.

        # Guidelines:
        # - Provide only one follow-up recommendation per response, starting with a directive such as "You can ask about...".
        # - Do not include any headings, labels, or summaries.
        # - Ensure the recommendation is extremely concise (around 7 words), directly relevant to the client’s previous responses, and focused on identifying or amplifying a specific pain point.
        # - Base your recommendation on the details provided in the user query, conversation history, and any retrieved documents.
        # - Adapt your recommendation dynamically according to the evolving conversation.
        # - Since the conversation is strictly for the {campaign} campaign, do not incorporate topics outside of this campaign’s scope.

        # Examples:

        # Example 1 (Immediate Health Concern):  
        # **Client:** "I'm really worried about my mounting medical bills."  
        # **AI Response:**  
        # You can ask about their urgent medical cost concerns.

        # Example 2 (Long-Term Care Need):  
        # **Client:** "I'm scared I might need long-term care soon."  
        # **AI Response:**  
        # You can ask about their planning for future care.

        # Example 3 (Income/Retirement Concern):  
        # **Client:** "I'm not sure I'll have enough to retire."  
        # **AI Response:**  
        # You can ask about their retirement income adequacy.

        # Example 4 (Legacy Concern):  
        # **Client:** "I want to ensure my family is secure after I'm gone."  
        # **AI Response:**  
        # You can ask about securing their family legacy.

        # User Query:  
        # {query}

        # Conversation History:  
        # {context}

        # Retrieved Documents:  
        # {retrieved_docs_text}

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

