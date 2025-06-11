import os
import logging
import requests
from openai import OpenAI
from flask import jsonify


from dotenv import load_dotenv
import time
import json
import re

from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory,ConversationSummaryBufferMemory
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain.chat_models import ChatOpenAI

logging.getLogger("openai").setLevel(logging.WARNING)

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logging.basicConfig(level=logging.DEBUG)

campaign = ""

responses = []
chains = {}
memories = {}  # Dictionary to store memory instances per email

# MAX_HISTORY = 10
# conversation_history = []

# def update_conversation_history(new_transcript):
#     """Update conversation history and ensure it doesn't exceed the max limit."""
#     global conversation_history
#     conversation_history.append(new_transcript)

#     if len(conversation_history) > MAX_HISTORY:
#         conversation_history.pop(0)

def parse_ai_response(raw_text: str) -> dict:
    cleaned = re.sub(r'^\s*```?json\s*', '', raw_text)   
    cleaned = re.sub(r'```$', '', cleaned, flags=re.MULTILINE)  
    cleaned = cleaned.strip()
    if cleaned.endswith('?'):
        cleaned = cleaned[:-1].strip()

    cleaned = cleaned.replace('**', '')
    cleaned = re.sub(r'"\s*\n\s*', '"', cleaned)

    # 3) Parse
    return json.loads(cleaned)

def clean_message_history(raw_history):
    cleaned = []
    for msg in raw_history:
        role = 'user' if msg['kwargs'].get('type') == 'human' else 'assistant'
        content = msg['kwargs'].get('content', '')
        cleaned.append({
            'role': role,
            'content': content
        })
    return cleaned

def convert_to_langchain_messages(message_list):
    lc_messages = []
    for msg in message_list:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
    return lc_messages

def is_new_meeting(minutes_passed):
    return minutes_passed < 0 or minutes_passed < 0.5

def analyze_conversation(query, email, total_meeting_minutes, minutes_passed, campaign):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""
    remaining_time = total_meeting_minutes-minutes_passed
    print("minutes_passed: ", minutes_passed)
    print("campaign: ", campaign)

    # Check if this is a new meeting and clear history if needed
    if is_new_meeting(minutes_passed):
        if email in memories:
            del memories[email]
            logging.info(f"***Cleared memory for email: {email}***")
        if email in chains:
            del chains[email]
            logging.info(f"***Cleared chain for email: {chains}***")

    if query:
        # Calling RAG endpoint
        rag_url = "https://rag.epiphanyadvisor.com/query/"
        # rag_url = "http://0.0.0.0:8000/query/"
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

    # context = "\n".join(conversation_history)

    # campaign = ""
    # try:
    #     res = requests.get("https://database.epiphanyadvisor.com/get_campaign")
    #     if res.status_code == 200:
    #         data = res.json()
    #         campaign = data.get("campaign")
    #         print(campaign)
    #     else:
    #         campaign = "medicare"
    # except Exception as e:
    #     logging.error(f"Error calling campaign endpoint: {e}")
    #     campaign = "medicare"

    prompt = f"""
        You are an AI assistant partnering with a sales representative. After each client response, the AI should decide on exactly **one** of the following, based on the flow of the conversation:

        **Campaign Context:** This conversation focuses on the **{campaign}** campaign, but to fully uncover client needs, interweave questions or insights from other specialties—Wealth Planning, Healthcare (Medicare), Life Insurance, and Long-Term Care—throughout the dialogue.
        1. **question**: to surface or amplify a pain point
        2. **pain_point**: to articulate a client pain or risk they've revealed
        3. **recommendation**: to offer a concise, actionable next-step

        ## Meeting Duration Context
        - **Total Meeting Time:** {total_meeting_minutes} minutes
        - **Minutes Remaining:** {remaining_time} minutes

        > **If fewer than 5 minutes remain**, switch to closing:
        > - Qualify product interest
        > - Ask budget and readiness questions
        > - Propose next steps

        User Query:
        {query}
        
        Conversation History: **Always see the previous conversations before responding. Don't repeat any Question/Pain Point/Recommendation which have already been addressed**.
        
        Retrieved Documents:
        {retrieved_docs_text}

        ## CRITICAL INSTRUCTION
        You MUST start the conversation from Page 2 (Immediate Health & Coverage) and progress strictly through the pages in order. Do not skip to Page 3 or any other page until all questions on Page 2 are completed. This is mandatory and non-negotiable.

        ## Conversation Flow (Modified Fact Finder)

        ### Page 1: The 4 Pillars of Personal Planning
        **Guidance:** Reference only - do not start here. Begin with Page 2.
        - **Financial Security:** Nest Egg, Savings, Income, Emergency Fund
        - **Medical Bills:** Doctor Visits, Critical Illness, Hospital Stays, Prescriptions
        - **Independence:** Post-Hospital Care, Home Care, Assisted Living, Family Support
        - **Legacy:** Final Expenses, Wills & Trusts, Spousal Support, Taxes

        ### Page 2: Immediate Health & Coverage
        **Guidance:** Use open-ended, client-focused prompts; vary wording each turn; balance factual and emotional triggers.
        - What made you book this meeting today?
        - What would make this a great value of your time?
        - Immediate healthcare priorities and concerns
        - Plan features: Benefits, Networks, Affordability, Reliability
        - Current insurance: group vs. individual, premiums, copays, deductibles, RX
        - Likes/dislikes and supplemental coverage (dental, vision, etc.)

        ### Page 3: Detailed Health Question Flow
        **Guidance:** Follow sequence, but reformulate each question dynamically; prompt for specifics and context.
        1. **What made you book this meeting today?**
        2. **What would make this a great value of your time?**
        3. **What are the most important things when it comes to your immediate health care?**
        4. **Is there anything that is concerning you right now with your level of health care?**
        5. **If you could create a new plan from scratch, what would be most important?**
           - A. Benefits
           - B. Networks
           - C. Affordability
           - D. Company Reliability
        6. **Do you have health insurance and if so is it group or individual?**
           Company Name(s): ________________  Plan Type: ________________
        7. **Do they have co-pays and/or deductibles, if so what are they?**
        8. **Do you pay a premium, if so how much?**
        9. **Does that come with RX Drugs as well (Y/N)?**
        10. **What have you liked best about this plan?**
        11. **Sometimes people have plans to supplement their medical insurance; like dental, vision, cancer or disability, do you have any of those?**

        ### Page 4: Long-Term Care (LTC)
        **Guidance:** Sequence chronologically; ask follow-ups based on family status; probe emotional and logistical factors.
        1. **Let's talk a little about family history—anything major that runs in the immediate family?**
        2. **Is mom and dad still around (Y/N)?** ____  **If so, how old are they?** ____
           **If deceased, how old were they when they passed and what did they pass from?**
           3A. _(If one or more was deceased)_ **How were their last days—at home or in a facility?**
           3B. _(If both alive)_ **How are they doing—living on their own or in a facility? Any help?**
        4. **Have you or a family member ever dealt with emotional or financial strain of long-term care?**
        5. **If you needed care starting yesterday, who would provide it?**
           Name: __________  Local (Y/N)? ____  Working/Family status: ____  Full-time or Part-time? ____
        6. **Have you gone over your LTC plan with your family or an attorney/insurer?**
        
        ### Page 5: Life Insurance & Estate
        **Guidance:** Cover legacy and protection; ask clarifying questions on purpose, beneficiaries, and satisfaction.
        1. **Do you have a will or trust in place and when was it last reviewed?**
           Purpose: ___________________________________________
        2. **Do you own life insurance?** (Y/N) ____  **Purpose at purchase:** ________________
        3. **Carrier:** ____________________  **Premium:** __________  **Type:** __________  **Death Benefit:** ______
        4. **Has anything changed since you purchased these policies?**
        5. **Is it important for you to leave a legacy?** (Y/N) ____
        6. **Anyone relying on your income if you passed away?** (Y/N) ____  **Who & why?** ________________
        7. **Are all your final expenses covered?** (Y/N) ____  **Important?** (Y/N) ____
        8. **Satisfied with coverage vs. cost?**
    
        ### Page 6: Retirement & Income
        **Guidance:** Assess income streams and risk appetite; prioritize next-step recommendations.
        1. **Are you pulling Social Security yet and how much are you receiving?**
        2. **Receiving any pension income?** (Y/N) ____  Amount: ________________
        3. **Still earning employment income?** (Y/N) ____  Amount: ________________
        4. **Taking distributions from investments?** (Y/N) ____  Amount: ________________
           **If not, will you have funds available later?** (Y/N) ____
        5. **After bills and fun, do you have money left to save?** (Y/N) ____  **Roughly how much?** ____
        6. **Concerns about running out of money now or later?** (Y/N) ____  **Why?** ________________
        7. **Which retirement risk concerns you most?**
           - Market Volatility / Crash
           - Inflation
           - Taxes
           - Legacy
           - Long-Term Care
           **Why that one?** __________________________________________________
        •- If no pushback, fill out a COMRA
        •- Go for an advisor referral: schedule time, offer free service, mention helping with investments.

        ## Question Rotation & Style Rules
        - **Strict Sequence**: You must strictly follow the questions flow from page 2, then page 3 and so on till end.
        - **Rotate** pages: 1 → 2 → 3 → 4 → 5 → 6
        - **Within Page 1**, rotate pillars: Financial Security → Medical Bills → Independence → Legacy
        - **Within Page 2**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 3**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 4**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 5**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 6**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Interleave** specialties every 2–3 turns; avoid repeats until two others used.
        - **Dynamic Generation:** Wording must vary each time—never repeat the exact same question.
        - **Format:** one **bold** question per turn, 7–10 words, optional depth clause.

        ## Question Flow Rules
        1. **Strict Sequence**: Follow the numbered questions in order
        2. **Progress Tracking**: Keep track of the last question asked
        3. **Pain Point Handling**: When a pain point is identified:
           - Address it immediately
           - Return to the next question in sequence
           - IGNORE any new topics or concerns raised in the user's response
        4. **Recommendation Handling**: When a recommendation is needed:
           - Provide it
           - Return to the next question in sequence
           - IGNORE any new topics or concerns raised in the user's response
        5. **No Skipping**: Don't skip questions unless explicitly answered
        6. **No Repeating**: Don't repeat questions unless clarification needed
        7. **Strict Return**: After ANY pain point or recommendation:
           - ALWAYS return to the next question in sequence
           - DO NOT follow up on new topics raised by the user
           - DO NOT deviate from the question sequence
        8. **User Response Handling**: 
           - If user raises new concerns during pain point/recommendation response
           - Acknowledge briefly but return to sequence
           - Do not explore new topics until sequence is complete

        ## Duplicate-Check
        - Re-read prior assistant messages; discard semantically/textually similar questions.

        ## Pain Point & Recommendation Repetition Rules
        1. **No Duplicate Themes:**  
        - See conversation history to confirm you haven’t used the same `pain_point`, `recommendation`, or follow-up question before.  
        - Never repeat an entire theme or question—always check prior turns.
        2. **Addressed-Pain Exclusion:**
        - If a pain point has already been addressed with a recommendation, do not surface that pain point again.
        3. **Follow-Up Exclusivity:**
        - In recommendations, avoid any follow-up question that appeared under a pain point.  
        - In pain points, avoid any follow-up question that appeared under a recommendation.
        4. **Semantic Novelty:**
        - Each new pain_point or recommendation must be distinct in angle or framing—no paraphrases of past content.
        5. When asked to surface a **new pain point** or **new recommendation**, generate a **semantically distinct** and **contextually relevant** one based on:  
        - The user's most recent query  
        - The retrieved documents  
        - The current campaign  
        6. Prioritize **new angles or framing** over paraphrasing existing responses.
        7. If a specific pain point has already been **addressed** (i.e. a recommendation or next step was given for it), **never** surface that same pain point again.
        8. **Cross-Category Exclusivity:**  
        - Recommendation follow-ups **must not** include any question previously used in pain_point follow-ups.  
        - Pain_point follow-ups **must not** include any question previously used in recommendation follow-ups.
        9. Prioritize **fresh angles, new triggers or fresh framing** over simple paraphrases.


        ## Output Format
        Emit **exactly one** JSON object:
        ```json
        // Question
        {{"type":"question","question":"<bold, 7–10-word question>"}}

        // Pain Point
        {{"type":"pain_point","follow_up":["<Q1>","<Q2>","<Q3>"],"pain_point":"<concise worry>"}}

        // Recommendation
        {{"type":"recommendation","follow_up":["<Q1>","<Q2>","<Q3>"],"recommendation":"<actionable next step>"}}
        ```

        ## Examples

        ### Question Examples (with suggestion line)

        You can ask about healthcare triggers or coverage gaps.

        ```json
        {{"type":"question","question":"**What made you book this meeting today?**"}}
        {{"type":"question","question":"**Which plan feature matters most to you?**"}}
        {{"type":"question","question":"**Are you concerned about hospital stay costs?**"}}
        {{"type":"question","question":"**Would a network change affect your care choices?**"}}
        ```

        ### Pain Point Examples (include follow-up list)

        ```json
        {{"type":"pain_point","follow_up":["Have you skipped medications due to cost?","How often does this affect your routine?","Would supplemental coverage ease this?"],"pain_point":"High prescription costs force you to skip essential medications."}}
        {{"type":"pain_point","follow_up":["Does caregiving strain your family resources?","Who would help if you needed long‐term care?","Have you planned for care costs?"],"pain_point":"No long-term care plan creates family uncertainty and stress."}}
        {{"type":"pain_point","follow_up":["Are you worried about outliving your savings?","How would market swings impact your income?","Would a guaranteed income help calm concerns?"],"pain_point":"Concerns about running out of retirement funds."}}
        ```

        ### Recommendation Examples (include follow-up list)

        ```json
        {{"type":"recommendation","follow_up":["Have you considered a supplemental Rx plan?","Would a benefits comparison help?","Can we review your deductible options?"],"recommendation":"Review your Medicare supplemental options for better coverage."}}
        {{"type":"recommendation","follow_up":["Would you like assistance setting up a trust?","Have you identified beneficiaries?","Is estate planning on your agenda?"],"recommendation":"Establish a trust to secure final expenses and legacy."}}
        {{"type":"recommendation","follow_up":["Can we run a retirement income projection?","Would you like to model long‐term care costs?","Have you set an emergency fund target?"],"recommendation":"Increase your emergency fund to cover six months of expenses."}}
        {{"type":"recommendation","follow_up":["When can we schedule your policy review?","Do you have premium budget constraints?","Would reminders help you stay on track?"],"recommendation":"Schedule a life insurance policy review this quarter."}}
        ```
    """

    if email not in chains or chains[email] is None:
        summarizer = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.0,
            max_tokens=500
        )

        # Create new memory instance with optimized settings
        if email not in memories:
            memories[email] = ConversationSummaryBufferMemory(
                llm=summarizer,
                memory_key="chat_history",
                return_messages=True,
                max_token_limit=2000
            )

        prompt_template = ChatPromptTemplate.from_messages([
            SystemMessage(content=prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{human_input}")
        ])

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.5,
            max_tokens=2000
        )

        chains[email] = LLMChain(
            llm=llm,
            prompt=prompt_template,
            memory=memories[email],
            verbose=False
        )

    try:
        response = chains[email].predict(human_input=query)
        result = response.strip()
        prev_data = chains[email].memory.chat_memory.messages
        serialized_messages = [msg.to_json() for msg in prev_data]
        clean_messages = clean_message_history(serialized_messages)

        print("Responses #####", result)
        print("MEMORY HISTORY ::::::", prev_data)
        return [parse_ai_response(result),clean_messages]

    except Exception as e:
        logging.error(f"LLMChain error: {e}")
        return None

def analyze_conversation_telephonic(query, email, total_meeting_minutes, minutes_passed, campaign):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""
    remaining_time = total_meeting_minutes-minutes_passed
    print("campaign: ", campaign)

    if is_new_meeting(minutes_passed):
        if email in memories:
            chains[email].memory.chat_memory.messages = []


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


    # campaign = ""
    # try:
    #     res = requests.get("https://database.epiphanyadvisor.com/get_campaign")
    #     if res.status_code == 200:
    #         data = res.json()
    #         campaign = data.get("campaign")
    #         print(campaign)
    #     else:
    #         campaign = "medicare"
    # except Exception as e:
    #     logging.error(f"Error calling campaign endpoint: {e}")
    #     campaign = "medicare"

    prompt = f"""
        You are an AI assistant partnering with a sales representative. After each client response, the AI should decide on exactly **one** of the following, based on the flow of the conversation:

        **Campaign Context:** This conversation focuses solely on the **{campaign}** campaign. Ask only about topics and pillars directly related to **{campaign}**—do not introduce other specialties or unrelated themes.
        1. **question**: to surface or amplify a pain point  
        2. **pain_point**: to articulate a client pain or risk they've revealed  
        3. **recommendation**: to offer a concise, actionable next-step  

        ## Meeting Duration Context
        - **Total Meeting Time:** {total_meeting_minutes} minutes  
        - **Minutes Remaining:** {remaining_time} minutes  

        > **If fewer than 5 minutes remain**, switch to closing:  
        > - Qualify product interest  
        > - Ask budget and readiness questions  
        > - Propose next steps


        User Query:  
        {query}
        
        Conversation History: Always see the previous conversations before responding. Don't repeat from previous responses.
        
        Retrieved Documents:  
        {retrieved_docs_text}

        ## Strict Question Flow
        You MUST progress strictly through the pages in order: start at Page 1, then Page 2, and so on. Only after completing all questions on the current page (or obtaining explicit answers) may you advance to the next page. If a pain_point or recommendation arises mid-page, address it immediately then return to the next question on the same page before advancing pages.

        ## Conversation Flow (Modified Fact Finder)

        ### Page 1: The 4 Pillars of Personal Planning
        **Guidance:** Rotate through these pillars when crafting questions; ensure dynamic phrasing and align to pillar context.
        - **Financial Security:** Nest Egg, Savings, Income, Emergency Fund
        - **Medical Bills:** Doctor Visits, Critical Illness, Hospital Stays, Prescriptions
        - **Independence:** Post-Hospital Care, Home Care, Assisted Living, Family Support
        - **Legacy:** Final Expenses, Wills & Trusts, Spousal Support, Taxes

        ### Page 2: Client Information

        **Guidance:** Use this page to gather essential personal and family context. Ask conversationally, not as a form; prioritize warmth and relevance.
        1. **Tell us a bit about you and your family?**
        2. **What’s your full legal name—and date of birth?**
        3. **Where are you currently living?** (Address, City, State, ZIP)
        4. **Best number to reach you on your cell?**
        5. **Is this the best email for follow-up?**
        6. **What kind of appointment is this—and how did you find us?**
        7. **Do you have children? What are their names and ages?**
        8. **Any grandkids? Names and ages?**
         *(If they have children or grandchildren not yet in college, mention the Sage program and how we can help support college savings.)*

        ### Page 3: Immediate Health & Coverage
        **Guidance:** Use open-ended, client-focused prompts; vary wording each turn; balance factual and emotional triggers.
        - What made you book this meeting today?
        - What would make this a great value of your time?
        - Immediate healthcare priorities and concerns
        - Plan features: Benefits, Networks, Affordability, Reliability
        - Current insurance: group vs. individual, premiums, copays, deductibles, RX
        - Likes/dislikes and supplemental coverage (dental, vision, etc.)

        ### Page 4: Detailed Health Question Flow
        **Guidance:** Follow sequence, but reformulate each question dynamically; prompt for specifics and context.
        1. **What made you book this meeting today?**
           
        2. **What would make this a great value of your time?**
           
        3. **What are the most important things when it comes to your immediate health care?**
            
        4. **Is there anything that is concerning you right now with your level of health care?**
           
        5. **If you could create a new plan from scratch, what would be most important?**
           - A. Benefits
           - B. Networks
           - C. Affordability
           - D. Company Reliability
        6. **Do you have health insurance and if so is it group or individual?**
           Company Name(s): ________________  Plan Type: ________________
        7. **Do they have co-pays and/or deductibles, if so what are they?**

        8. **Do you pay a premium, if so how much?**
           
        9. **Does that come with RX Drugs as well (Y/N)?**
           
        10. **What have you liked best about this plan?**
           
        11. **Sometimes people have plans to supplement their medical insurance; like dental, vision, cancer or disability, do you have any of those?**

        ### Page 5: Long-Term Care (LTC)
        **Guidance:** Sequence chronologically; ask follow-ups based on family status; probe emotional and logistical factors.
        1. **Let's talk a little about family history—anything major that runs in the immediate family?**
        2. **Is mom and dad still around (Y/N)?** ____  **If so, how old are they?** ____
           **If deceased, how old were they when they passed and what did they pass from?**
           
           3A. _(If one or more was deceased)_ **How were their last days—at home or in a facility?**
               
           3B. _(If both alive)_ **How are they doing—living on their own or in a facility? Any help?**
               
        4. **Have you or a family member ever dealt with emotional or financial strain of long-term care?**

        5. **If you needed care starting yesterday, who would provide it?**
           Name: __________  Local (Y/N)? ____  Working/Family status: ____  Full-time or Part-time? ____
        6. **Have you gone over your LTC plan with your family or an attorney/insurer?**
           

        ### Page 6: Life Insurance & Estate
        **Guidance:** Cover legacy and protection; ask clarifying questions on purpose, beneficiaries, and satisfaction.
        1. **Do you have a will or trust in place and when was it last reviewed?**
           Purpose: 
        2. **Do you own life insurance?** (Y/N) ____  **Purpose at purchase:** ________________
        3. **Carrier:** ____________________  **Premium:** __________  **Type:** __________  **Death Benefit:** ______
        4. **Has anything changed since you purchased these policies?**
           
        5. **Is it important for you to leave a legacy?** (Y/N) ____
        6. **Anyone relying on your income if you passed away?** (Y/N) ____  **Who & why?** ________________
        7. **Are all your final expenses covered?** (Y/N) ____  **Important?** (Y/N) ____
        8. **Satisfied with coverage vs. cost?**
           

        ### Page 7: Retirement & Income
        **Guidance:** Assess income streams and risk appetite; prioritize next-step recommendations.
        1. **Are you pulling Social Security yet and how much are you receiving?**
        2. **Receiving any pension income?** (Y/N) ____  Amount: ________________
        3. **Still earning employment income?** (Y/N) ____  Amount: ________________
        4. **Taking distributions from investments?** (Y/N) ____  Amount: ________________
           **If not, will you have funds available later?** (Y/N) ____
        5. **After bills and fun, do you have money left to save?** (Y/N) ____  **Roughly how much?** ____
        6. **Concerns about running out of money now or later?** (Y/N) ____  **Why?** ________________
        7. **Which retirement risk concerns you most?**
           - Market Volatility / Crash
           - Inflation
           - Taxes
           - Legacy
           - Long-Term Care
           **Why that one?** 
        •- If no pushback, fill out a COMRA
        •- Go for an advisor referral: schedule time, offer free service, mention helping with investments.

        ## Question Rotation & Style Rules
        - **Rotate** pages: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 1**, rotate pillars: Financial Security → Medical Bills → Independence → Legacy
        - **Within Page 2**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 3**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 4**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 5**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 6**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Within Page 7**, rotate questions: 1 → 2 → 3 → 4 → 5 → 6 → 7
        - **Interleave** specialties every 2–3 turns; avoid repeats until two others used.
        - **Dynamic Generation:** Wording must vary each time—never repeat the exact same question.
        - **Format:** one **bold** question per turn, 7–10 words, optional depth clause.


        ## Question Flow Rules
        1. **Strict Sequence**: Follow the numbered questions in order
        2. **Progress Tracking**: Keep track of the last question asked
        3. **Pain Point Handling**: When a pain point is identified:
           - Address it immediately
           - Return to the next question in sequence
           - IGNORE any new topics or concerns raised in the user's response
        4. **Recommendation Handling**: When a recommendation is needed:
           - Provide it
           - Return to the next question in sequence
           - IGNORE any new topics or concerns raised in the user's response
        5. **No Skipping**: Don't skip questions unless explicitly answered
        6. **No Repeating**: Don't repeat questions unless clarification needed
        7. **Strict Return**: After ANY pain point or recommendation:
           - ALWAYS return to the next question in sequence
           - DO NOT follow up on new topics raised by the user
           - DO NOT deviate from the question sequence
        8. **User Response Handling**: 
           - If user raises new concerns during pain point/recommendation response
           - Acknowledge briefly but return to sequence
           - Do not explore new topics until sequence is complete

        ## Duplicate-Check
        - Re-read prior assistant messages; discard semantically/textually similar questions.

        ## Pain Point & Recommendation Repetition Rules
        1. **Never Repeat** a pain point or recommendation already generated during this conversation.  
        2. Maintain an internal history of previously used `pain_point` and `recommendation` values.  
        3. When asked to surface a **new pain point** or **new recommendation**, generate a **semantically distinct** and **contextually relevant** one based on:  
        - The user's most recent query  
        - The retrieved documents  
        - The current campaign  
        4. Prioritize **new angles or framing** over paraphrasing existing responses.  


        ## Output Format
        Emit **exactly one** JSON object:
        ```json
        // Question
        {{"type":"question","question":"<bold, 7–10-word question>"}}

        // Pain Point
        {{"type":"pain_point","follow_up":["<Q1>","<Q2>","<Q3>"],"pain_point":"<concise worry>"}}
        // Recommendation
        {{"type":"recommendation","follow_up":["<Q1>","<Q2>","<Q3>"],"recommendation":"<actionable next step>"}}
        ````

        ## Examples

        ### Question Examples (with suggestion line)

        You can ask about healthcare triggers or coverage gaps.

        ```json
        {{"type":"question","question":"**What made you book this meeting today?**"}}
        {{"type":"question","question":"**Which plan feature matters most to you?**"}}
        {{"type":"question","question":"**Are you concerned about hospital stay costs?**"}}
        {{"type":"question","question":"**Would a network change affect your care choices?**"}}
        ```

        ### Pain Point Examples (include follow-up list)

        ```json
        {{"type":"pain_point","follow_up":["Have you skipped medications due to cost?","How often does this affect your routine?","Would supplemental coverage ease this?"],"pain_point":"High prescription costs force you to skip essential medications."}}
        {{"type":"pain_point","follow_up":["Does caregiving strain your family resources?","Who would help if you needed long‐term care?","Have you planned for care costs?"],"pain_point":"No long-term care plan creates family uncertainty and stress."}}
        {{"type":"pain_point","follow_up":["Are you worried about outliving your savings?","How would market swings impact your income?","Would a guaranteed income help calm concerns?"],"pain_point":"Concerns about running out of retirement funds."}}
        ```

        ### Recommendation Examples (include follow-up list)

        ```json
        {{"type":"recommendation","follow_up":["Have you considered a supplemental Rx plan?","Would a benefits comparison help?","Can we review your deductible options?"],"recommendation":"Review your Medicare supplemental options for better coverage."}}
        {{"type":"recommendation","follow_up":["Would you like assistance setting up a trust?","Have you identified beneficiaries?","Is estate planning on your agenda?"],"recommendation":"Establish a trust to secure final expenses and legacy."}}
        {{"type":"recommendation","follow_up":["Can we run a retirement income projection?","Would you like to model long‐term care costs?","Have you set an emergency fund target?"],"recommendation":"Increase your emergency fund to cover six months of expenses."}}
        {{"type":"recommendation","follow_up":["When can we schedule your policy review?","Do you have premium budget constraints?","Would reminders help you stay on track?"],"recommendation":"Schedule a life insurance policy review this quarter."}}
        ```

    """

    if email not in chains or chains[email] is None:
        summarizer = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.0,
            max_tokens=1000
        )

        # Create new memory instance for this email if it doesn't exist
        if email not in memories:
            memories[email] = ConversationSummaryBufferMemory(
                llm=summarizer,
                memory_key="chat_history",
                return_messages=True,
                max_token_limit=2000
            )

        prompt_template = ChatPromptTemplate.from_messages([
            SystemMessage(content=prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{human_input}")
        ])

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=2000
        )

        chains[email] = LLMChain(
            llm=llm,
            prompt=prompt_template,
            memory=memories[email],  # Use email-specific memory
            verbose=True
        )

    try:
        response = chains[email].predict(human_input=query)
        result = response.strip()
        prev_data = chains[email].memory.chat_memory.messages
        serialized_messages = [msg.to_json() for msg in prev_data]
        clean_messages = clean_message_history(serialized_messages)

        print("Responses #####", result)
        print("MEMORY HISTORY ::::::", clean_messages)
        return [parse_ai_response(result),clean_messages]

    except Exception as e:
        logging.error(f"LLMChain error: {e}")
        return None



    # messages.append({"role":"system", "content": prompt})

    # print("Inside telephonic")
    # response = client.chat.completions.create(model="gpt-4o",
    # messages=messages,
    # # messages=[
    # #     {"role": "system", "content": "You are a professional assistant for Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning."},
    # #     {"role": "user", "content": prompt}
    # # ],
    # temperature=0.7)

    # result = response.choices[0].message.content.strip()
    # # return None if result == "NO_ACTION" else result
    # return parse_ai_response(result)


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


    response = client.chat.completions.create(model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are an expert in financial and healthcare planning."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.7)

    summary = response.choices[0].message.content.strip()
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

    response = client.chat.completions.create(model="gpt-4.1",
    messages=[
        {"role": "system", "content": "You are an expert in summarizing meetings for clients, with a focus on clear communication and actionable next steps."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.7)

    summary = response.choices[0].message.content.strip()
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


    response = client.chat.completions.create(model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a strategic advisor who analyzes client conversations to identify cross-campaign interests."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.7)

    result = response.choices[0].message.content.strip()
    print(result)
    return result


def generate_conversation_summary(history, 
                                  model= "gpt-4-turbo", 
                                  temperature: float = 0.0):
    conversation_text = "\n".join(history)

    system_message = {
        "role": "system",
        "content": (
            "You are a helpful assistant that reads a meeting transcript "
            "and produces a clear, concise summary covering key points, "
            "action items, and decisions made."
        )
    }

    user_message = {
        "role": "user",
        "content": (
            f"Please read the following conversation and provide a summary:\n\n"
            f"{conversation_text}\n\n"
            "Return the summary as plain text."
        )
    }

    response = client.chat.completions.create(model=model,
    messages=[system_message, user_message],
    temperature=temperature)

    summary = response.choices[0].message.content.strip()
    return summary
