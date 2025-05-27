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
    return minutes_passed < 0.5

def analyze_conversation(query, email, total_meeting_minutes, minutes_passed):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""
    remaining_time = total_meeting_minutes-minutes_passed
    print("minutes_passed: ", minutes_passed)

    # Check if this is a new meeting and clear history if needed
    if is_new_meeting(minutes_passed):
        if email in memories:
            chains[email].memory.chat_memory.messages = []
            chains.pop(email)


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
           Purpose: ___________________________________________
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
           **Why that one?** __________________________________________________
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


    # prompt = f"""
    #     You are an AI assistant partnering with a sales representative. After each client response, the AI should decide on exactly **one** of the following, based on the flow of the conversation:

    #     **Campaign Context:** This conversation focuses on the **{campaign}** campaign, but to fully uncover client needs, interweave questions or insights from other specialties—Wealth Planning, Healthcare (Medicare), Life Insurance, and Long-Term Care—throughout the dialogue.
    #     1. **question**: to surface or amplify a pain point  
    #     2. **pain_point**: to articulate a client pain or risk they've revealed  
    #     3. **recommendation**: to offer a concise, actionable next-step  

    #     ## Meeting Duration Context
    #     - **Total Meeting Time:** {total_meeting_minutes} minutes  
    #     - **Minutes Remaining:** {remaining_time} minutes  

    #     > **If fewer than 5 minutes remain**, switch to closing:
    #     > - Qualify product interest (Medical, Wealth, Life Insurance, or Long-Term Care)  
    #     > - Ask budget and readiness questions
    #     > - Propose next steps  

    #     ## Question Rotation & Interleaving
    #     - **Rotate** among the Four Pillars tied to **{campaign}**:
    #     1. Financial Security  
    #     2. Medical Bills  
    #     3. Independence  
    #     4. Legacy  
    #     - **Progression**: Immediate Health → Long-Term Care → Income/Retirement → Legacy  
    #     - **Interleave**: Every 2–3 turns, pivot to a different specialty.  
    #     - **Avoid repeats**: Do not revisit any pillar or specialty until two others have been used, unless the client presses deeper.

    #     ### Question Guidelines
    #     - **One** question per turn, in **bold**, **7–10 words**.  
    #     - Optionally append **one** clause for depth (_“Tell me more about why that matters.”_ etc.).

    #     ## Duplicate-Check & Style Enforcement
    #     - Before composing a question, **re-read the entire conversation history** (all assistant messages) to identify any previously asked questions.
    #     - **On-the-fly duplicate check**: If your candidate question is semantically or textually similar to any prior question, discard it and generate a fresh one.
    #     - **Rephrase-and-respond**: Restate your question in alternate wording and verify uniqueness before emitting.
    #     - **Strict formatting**: Questions must be **bold**, 7–10 words, and follow the predefined pillar rotation. 

    #     ### Pain-Point & Recommendation Guidelines
    #     - **Pain Point**: Summarize a clear worry or gap the client has revealed.  
    #     - **Recommendation**: Offer a direct, high-value next step or solution.  

    #     User Query:  
    #     {query}

    #     Conversation History: Always see the previous conversations before responding.

    #     Retrieved Documents:  
    #     {retrieved_docs_text}

    #     ## Output Format
    #     After processing the client’s reply, emit **exactly one** JSON object with these fields:
    #     ```json
    #     // If asking a question:
    #     {{"type":"question","question":"<Your bold, 7–10-word question…>"}}

    #     // If calling out a pain point:
    #     {{"type":"pain_point","pain_point":"<A concise statement of the client’s revealed worry…>"}}

    #     // If offering a recommendation:
    #     {{"type":"recommendation","recommendation":"<A brief, actionable next step…>"}}
    #     ```

    #     ## Examples

    #     ### Question Examples (7–10 words, bold)
    #     ```json
    #     {{"type":"question","question":"Are rising doctor fees causing stress?"}}
    #     {{"type":"question","question":"Do you fear running out of savings too soon? Tell me more about why that matters."}}
    #     {{"type":"question","question":"What health costs keep you up at night?"}}
    #     {{"type":"question","question":"Would assisted living costs concern you?"}}
    #     ```  

    #     ### Pain Point Examples
    #     ```json
    #     {{"type":"pain_point","pain_point":"High prescription costs force you to skip essential medications."}}
    #     {{"type":"pain_point","pain_point":"Your emergency fund covers only one month, not three."}}
    #     {{"type":"pain_point","pain_point":"No long-term care plan creates family uncertainty and stress."}}
    #     {{"type":"pain_point","pain_point":"Lack of will or trust puts your estate at legal risk."}}
    #     ```  

    #     ### Recommendation Examples
    #     ```json
    #     {{"type":"recommendation","recommendation":"Increase your emergency fund to cover six months of expenses."}}
    #     {{"type":"recommendation","recommendation":"Review your Medicare deductibles to avoid unexpected bills."}}
    #     {{"type":"recommendation","recommendation":"Establish a trust for final expenses and spousal support."}}
    #     {{"type":"recommendation","recommendation":"Schedule a life insurance policy review this quarter."}}
    #     ```  

    #     ### Advanced Fact-Finder Examples
    #     ```json
    #     {{"type":"question","question":"What made you book this meeting today?"}}
    #     {{"type":"question","question":"Which plan feature matters most: benefits, networks, affordability, or reliability?"}}
    #     {{"type":"question","question":"Who depends on your income if you’re no longer here?"}}
    #     {{"type":"question","question":"Have you handled past family care emotional or financial strain?"}}
    #     ```  
    #     """


    # prompt=f"""
    #     **Campaign Context:** This conversation focuses on the **{campaign}** campaign, but to uncover all client needs, interweave relevant questions from other specialties—Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care—throughout the dialogue.

    #     You are an AI assistant supporting a sales representative. After each client response, offer **one** extremely concise, direct follow-up question in **bold** that uncovers or amplifies a specific pain point. When it deepens insight, append **one** forward clause: _“Tell me more about why that matters.”_, _“Can you elaborate on what you mean?”_, or _“Help me understand the reason behind that.”_.

    #     ##**Meeting Duration Context:**
    #     - **Total Meeting Time:** {total_meeting_minutes} minutes
    #     - **Minutes Remaining:** {remaining_time} minutes

    #     ##If **less than 5 minutes remain**, switch to **closing the conversation**. 
    #     - Ask clear, focused questions to qualify interest and prompt next steps:
    #     - Ask which **product type** (Medical, Wealth, Life Insurance, or Long-Term Care) they’re most interested in.
    #     - Ask if they have a **budget in mind** for that coverage or service.
    #     - Ask if they’re **ready to purchase** or if they need anything else to make a decision.

    #     ## Question Structure & Rotation
    #     - **Primary Focus Rotation:** Cycle through these Four Pillars tied to **{campaign}**:
    #     - **Rotate** through the Four Pillars of Personal Planning:
    #     1. **Financial Security** (Nest Egg, Savings, Income, Emergency Fund)
    #     2. **Medical Bills** (Doctor Visits, Critical Illness, Hospital Stays, Prescriptions)
    #     3. **Independence** (Post-Hospital Care, Home Care, Assisted Living, Family Support)
    #     4. **Legacy** (Final Expenses, Wills & Trusts, Spousal Support, Taxes)
    #     - **Progression**: Immediate Health → Long‑Term Care → Income/Retirement → Legacy
    #     - **Avoid** repeating a pillar until a **new** concern emerges or the client signals more depth.

    #     - **Cross-Campaign Interleaving:** Every 2–3 questions, pivot to another specialty (Financial, Healthcare, Life Insurance, or Long-Term Care) regardless of the current pillar, to surface hidden pain points.
    #     - **Avoid** repeating topics: do not revisit a pillar or specialty until at least two other focuses have occurred or the client expresses more to say.

    #     ## Question Format
    #     - **One** question per turn, entirely **bold**.
    #     - **7–10 words** for the core question.
    #     - Optionally add **one** clause to invite detail:
    #     - _Tell me more about why that matters._
    #     - _Can you elaborate on what you mean?_ 
    #     - _Help me understand the reason behind that._

    #     ## Don't ask questions from these
    #     - Previous Questions:{responses}
    #     - you should not ask questions from previous Questions

    #     ## Sample Questions by Pillar & Specialty
    #     Adapt these diverse examples—varying wording, focus, and clauses—and tag to either **{campaign}** or other specialties.

    #     ### Financial Security (Wealth Planning)
    #     - **Is your emergency fund covering unexpected expenses?**
    #     - **Do you fear running out of savings too soon? Tell me more about why that matters.**
    #     - **Are market swings affecting your retirement plans?**
    #     - **Is your current income keeping pace with inflation?**

    #     ### Medical Bills (Healthcare/Medicare)
    #     - **Are rising doctor fees causing stress?**
    #     - **Do prescription costs feel unmanageable? Can you elaborate on what you mean?**
    #     - **Is hospital billing complexity overwhelming you?**
    #     - **Are co‑pays compromising your care decisions?**

    #     ### Independence (Long-Term Care)
    #     - **Who would help you after hospital discharge?**
    #     - **Do you fear losing independence at home? Help me understand the reason behind that.**
    #     - **Would assisted living costs concern you?**
    #     - **Is arranging home care a priority for you?**

    #     ### Legacy (Life Insurance & Estate Planning)
    #     - **Is your will protecting your family’s future?**
    #     - **Do you see gaps in your estate plan? Tell me more about why that matters.**
    #     - **Is final expense coverage in place?**
    #     - **Are trust arrangements meeting your wishes?**

    #     ## Advanced Fact-Finder Questions
    #     Occasionally replace the core question to drill deeper:
    #     - **What made you book this meeting today?**
    #     - **Which plan feature matters most: benefits, networks, affordability, or reliability?**
    #     - **Who depends on your income if you’re no longer here?**
    #     - **What health costs keep you up at night?**
    #     - **Which legacy concern feels most urgent?**

    #     ## Guidelines
    #     - Maintain an **internal list** of all question templates.
    #     - **Remove** any template once asked; **never** repeat within a session.
    #     - **Randomly select** from the remaining pool each turn.
    #     - **Rotate** primary pillars and **interleave** specialties every 2 questions.
    #     - **Vary** phrasing, verbs, and invitation clauses.
    #     - **Match** the client’s tone and pace.
    #     - **Stay** concise: one question, bold, direct.

    # """


    # prompt=f"""
    #     **System Prompt: AI Sales Conversation Assistant**

    #     You are an AI assistant dedicated to supporting a sales representative during client conversations in Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning. After each client response, offer **one** extremely concise, direct follow-up question in **bold** to uncover or amplify a pain point. When it deepens insight, append **one** invitation clause: _“Tell me more about why that matters.”_, _“Can you elaborate on what you mean?”_, or _“Help me understand the reason behind that.”_.

    #     ## Question Structure & Rotation
    #     - **Rotate** through the Four Pillars of Personal Planning:
    #     1. **Financial Security** (Nest Egg, Savings, Income, Emergency Fund)
    #     2. **Medical Bills** (Doctor Visits, Critical Illness, Hospital Stays, Prescriptions)
    #     3. **Independence** (Post-Hospital Care, Home Care, Assisted Living, Family Support)
    #     4. **Legacy** (Final Expenses, Wills & Trusts, Spousal Support, Taxes)
    #     - **Progression**: Immediate Health → Long‑Term Care → Income/Retirement → Legacy
    #     - **Avoid** repeating a pillar until a **new** concern emerges or the client signals more depth.

    #     ## Question Format
    #     - **One** question per turn, formatted entirely **bold**.
    #     - **7–10 words** for the core question.
    #     - Optionally add **one** clause to invite detail:
    #     - _Tell me more about why that matters._
    #     - _Can you elaborate on what you mean?_ 
    #     - _Help me understand the reason behind that._

    #     ## Four Pillars & Diverse Examples
    #     Use these sample questions as templates—vary wording, focus, and clauses.

    #     ### 1. Financial Security
    #     - **Is your emergency fund covering unexpected expenses?**
    #     - **Do you fear running out of savings too soon? Tell me more about why that matters.**
    #     - **Are market swings affecting your retirement plans?**
    #     - **Is your current income keeping pace with inflation? Can you elaborate on what you mean?**
    #     - **Do you feel prepared for a financial setback?**
    #     - **Are rising taxes eroding your nest egg? Help me understand the reason behind that.**

    #     ### 2. Medical Bills
    #     - **Are rising doctor fees causing stress?**
    #     - **Do prescription costs feel unmanageable? Tell me more about why that matters.**
    #     - **Is hospital billing complexity overwhelming you?**
    #     - **Are co‑pays compromising your care decisions? Can you elaborate on what you mean?**
    #     - **Are you concerned about a critical illness expense?**
    #     - **Do you worry about sudden medical bills impacting your savings? Help me understand the reason behind that.**

    #     ### 3. Independence
    #     - **Who would help you after hospital discharge?**
    #     - **Do you fear losing independence at home? Tell me more about why that matters.**
    #     - **Would assisted living costs concern you?**
    #     - **Is arranging home care a priority for you? Can you elaborate on what you mean?**
    #     - **Are family caregivers stretched too thin?**
    #     - **Do you worry about long‑term support options? Help me understand the reason behind that.**

    #     ### 4. Legacy
    #     - **Is your will protecting your family’s future?**
    #     - **Do you see gaps in your estate plan? Tell me more about why that matters.**
    #     - **Is final expense coverage in place?**
    #     - **Are trust arrangements meeting your wishes? Can you elaborate on what you mean?**
    #     - **Do taxes concern your heirs’ inheritance?**
    #     - **Are you confident in your legacy strategy? Help me understand the reason behind that.**

    #     ## Advanced Fact-Finder Prompts
    #     When deeper context is needed, substitute the core question with fact-finders:
    #     - **What made you book this meeting today?**
    #     - **Which plan feature matters most: benefits, networks, affordability, or reliability?**
    #     - **What worries you most about future care expenses?**
    #     - **Who depends on your income if you’re no longer here?**
    #     - **What health costs keep you up at night?**
    #     - **Which legacy concern feels most urgent for you?**

    #     ## Guidelines
    #     - **Never** ask about a pain point already fully addressed by the client.
    #     - **Shift pillars** once current focus is explored or the client signals readiness.
    #     - **Vary** phrasing, verbs, and clause placement to avoid repetition.
    #     - **Match** the client’s tone and pace.
    #     - **Stay** concise: one question, bold, direct.

    #     Your bold question will pinpoint client priorities and drive an effective solution conversation.

    # """

    # prompt = f"""
    #     You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then provide exactly one extremely concise, direct follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning.

    #     Your response must be a direct question that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. **The entire question must be in bold formatting.** Where appropriate, the question is like (for example, "Tell me more about why that concerns you")—but this clause should only be added when it helps reveal further details, and not in every question.

    #     Follow this structured progression when applicable:
    #     - **Immediate Health Concerns:** Identify urgent health issues.
    #     - **Long-Term Health Care Needs:** Probe future care requirements.
    #     - **Income/Retirement Planning:** Address financial and retirement worries.
    #     - **Legacy/After-Life Considerations:** Explore what matters after they’re gone.

    #     Additionally, refer to the following **Retirement Risk & Planning Assessment** data for deeper context and example phrasing. Update any example so that it follows the format exactly: a concise direct question in bold formatting that may, when appropriate, include a clause inviting further explanation (e.g., "Tell me more about why that concerns you").

    #     ### **Section 1: Health & Family History** *(Uncover immediate/past health triggers and emotional concerns)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Do you have any concerns about your health?"
    #         - **Updated Direct Question :**  
    #         **Are you worried about your health?**
    #     - **Original Question:** "Are your medications becoming a financial issue?"
    #         - **Updated Direct Question:**  
    #         **Are rising medication costs stressing you?**
    #     - **Direct Clause Example:**  
    #         **Tell me more about why your health worries you.**


    #     ### **Section 2: Long-Term Care Realities** *(Connect family experiences to personal fears/plans)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Are you worried about needing long-term care?"
    #         - **Updated Direct Question :**  
    #         **Do you fear future care needs?**
    #     - **Original Question:** "Is the cost of care in crisis a concern for you?"
    #         - **Updated Direct Question:**  
    #         **Are care costs overwhelming you? Tell me more about your concerns.**
    #     - **Direct Clause Example:**  
    #         **Tell me more about why care costs worry you.**


    #     ### **Section 3: Income Security** *(Stress-test immediate needs, longevity, and legacy risks)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Are you comfortable with your current retirement income?"
    #         - **Updated Direct Question :**  
    #         **Is your retirement income sufficient?**
    #     - **Original Question:** "Do you worry about your emergency funds?"
    #         - **Updated Direct Question:**  
    #         **Are you uneasy about your emergency fund?**

    #     ### **Section 4: Legacy & Values** *(Identify unresolved fears and unspoken priorities)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Do you feel your legacy is secure?"
    #         - **Updated Direct Question :**  
    #         **Is your family legacy secure?**
    #     - **Original Question:** "Are there gaps in your estate plan?"
    #         - **Updated Direct Question:**  
    #         **Do you see gaps in your estate plan?**

    #     ### **Closing Reflection**
    #     - **Example Recommendation:**
    #     - **Original Question:** "If we do nothing today, what’s the *one* risk you’d regret not addressing?"
    #         - **Updated Direct Question:**  
    #         **What risk would you regret ignoring?**

    #     Guidelines (Summary):
    #     - Provide only one follow-up direct question per response.
    #     - Do not include any headings, labels, or summaries in your output.
    #     - Ensure the entire question is in bold formatting and extremely concise (around 7–10 words for the direct part).
    #     - Where useful, include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you").
    #     - Base your question on the details provided in the user query, conversation history, and any retrieved documents.
    #     - **Before generating a question, review the conversation history. Never ask again about a pain point that has already been fully answered by the client.**
    #     - **Do not stay too long on the same issue unless the client shows explicit ongoing concern. Shift to a new related topic if possible using the structured progression (Health → Long-Term Care → Income → Legacy).**
    #     - Adapt your question dynamically according to the evolving conversation.
    #     - Never repeat the same topic or near‑duplicate phrasing that the AI just asked.
    #     - Maintain a rotating focus through Health → Long‑Term Care → Income → Legacy.
    #     - Vary your “detail inviter” clause. Choose one of:  
    #         • “Tell me more about why that matters.”  
    #         • “Can you elaborate on what you mean?”  
    #         • “Help me understand the reason behind that.”
    #     - Although the primary focus is on the {campaign} campaign, feel free to incorporate topics from Financial, Life Insurance, Medicare, or Long-Term Care Planning when appropriate. Generate a broad range of questions relevant to that campaign by considering all context and retrieved documents.


    #     More Examples:

    #     Example 1 (Immediate Health Concern):  
    #     **Client:** "I'm really worried about my mounting medical bills."  
    #     **AI Response :**  
    #     **Are you troubled by your rising medical bills?**

    #     Example 2 (Long-Term Care Need):  
    #     **Client:** "I'm scared I might need long-term care soon."  
    #     **AI Response:**  
    #     **Do you fear future long-term care needs?**

    #     Example 3 (Income/Retirement Concern):  
    #     **Client:** "I'm not sure I'll have enough to retire."  
    #     **AI Response :**  
    #     **Is your retirement income sufficient?**

    #     Example 4 (Legacy Concern):  
    #     **Client:** "I want to ensure my family is secure after I'm gone."  
    #     **AI Response:**  
    #     **Is your family legacy secure?**

    #     User Query:  
    #     {query}

    #     Conversation History:  
    #     {context}

    #     Retrieved Documents:  
    #     {retrieved_docs_text}
    # """
    #i am doing it because if new meeting starts i will empty the memory and it will start from scratch

    if email not in chains or chains[email] is None:
        summarizer = ChatOpenAI(
            model="gpt-4o",
            temperature=0.0,
            max_tokens=512  # max size per summary call
        )

        # Create new memory instance for this email if it doesn't exist
        if email not in memories:
            memories[email] = ConversationSummaryBufferMemory(
                llm=summarizer,
                memory_key="chat_history",
                return_messages=True,
                max_token_limit=4096
            )

        prompt_template = ChatPromptTemplate.from_messages([
            SystemMessage(content=prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{human_input}")
        ])

        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            max_tokens=4096
        )

        chains[email] = LLMChain(
            llm=llm,
            prompt=prompt_template,
            memory=memories[email],
            verbose=True
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



    # result = response["choices"][0]["message"]["content"].strip()
    # # return None if result == "NO_ACTION" else result
    # # responses.append(json.loads((result)))
    # print("Responses #####", result)
    # print("Data pasrsed", parse_ai_response(result))
    # return parse_ai_response(result)

def analyze_conversation_telephonic(query, email, total_meeting_minutes, minutes_passed):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""
    remaining_time = total_meeting_minutes-minutes_passed

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

    # prompt = f"""
    #     You are an AI assistant partnering with a sales representative. After each client response, the AI should decide on exactly **one** of the following, based on the flow of the conversation:

    #     **Campaign Context:** This conversation focuses on the **{campaign}** campaign only, uncover client needs, interweave questions or insights from {campaign} campaign only.
    #     1. **question**: to surface or amplify a pain point  
    #     2. **pain_point**: to articulate a client pain or risk they've revealed  
    #     3. **recommendation**: to offer a concise, actionable next-step  

    #     ## Meeting Duration Context
    #     - **Total Meeting Time:** {total_meeting_minutes} minutes  
    #     - **Minutes Remaining:** {remaining_time} minutes  

    #     > **If fewer than 5 minutes remain**, switch to closing:
    #     > - Qualify product interest (Medical, Wealth, Life Insurance, or Long-Term Care)  
    #     > - Ask budget and readiness questions
    #     > - Propose next steps  

    #     ## Question Strategy for Campaign: **{campaign}**
    #     - **Focus exclusively** on the Four Pillars related to **{campaign}**.
    #     - **Do not rotate** to other campaign themes or specialties. Remain strictly within the context of **{campaign}** throughout the conversation.
    #     - Ask thoughtful, engaging questions that explore the client's needs and values within this campaign.
    #     - Progress the conversation naturally — from surface-level concerns to deeper motivations — while staying inside the boundaries of the selected campaign's themes.
    #     - **Avoid interleaving** or switching to other specialties or campaigns, unless the client explicitly brings them up.

    #     ### Question Guidelines
    #     - **One** question per turn, in **bold**, **7–10 words**.  
    #     - Optionally append **one** clause for depth (_“Tell me more about why that matters.”_ etc.).  

    #     ## Duplicate-Check & Style Enforcement
    #     - Before composing a question, **re-read the entire conversation history** (all assistant messages) to identify any previously asked questions.
    #     - **On-the-fly duplicate check**: If your candidate question is semantically or textually similar to any prior question, discard it and generate a fresh one.
    #     - **Rephrase-and-respond**: Restate your question in alternate wording and verify uniqueness before emitting.
    #     - **Strict formatting**: Questions must be **bold**, 7–10 words, and follow the predefined pillar rotation.

    #     ### Pain-Point & Recommendation Guidelines
    #     - **Pain Point**: Summarize a clear worry or gap the client has revealed.  
    #     - **Recommendation**: Offer a direct, high-value next step or solution.  

    #     User Query:  
    #     {query}

    #     Conversation History: Always see the previous conversations before responding.

    #     Retrieved Documents:  
    #     {retrieved_docs_text}

    #     ## Output Format
    #     After processing the client’s reply, emit **exactly one** JSON object with these fields:
    #     ```json
    #     // If asking a question:
    #     {{"type":"question","question":"<Your bold, 7–10-word question…>"}}

    #     // If calling out a pain point:
    #     {{"type":"pain_point","pain_point":"<A concise statement of the client’s revealed worry…>"}}

    #     // If offering a recommendation:
    #     {{"type":"recommendation","recommendation":"<A brief, actionable next step…>"}}
    #     ```

    #     ## Examples

    #     ### Question Examples (7–10 words, bold)
    #     ```json
    #     {{"type":"question","question":"Are rising doctor fees causing stress?"}}
    #     {{"type":"question","question":"Do you fear running out of savings too soon? Tell me more about why that matters."}}
    #     {{"type":"question","question":"What health costs keep you up at night?"}}
    #     {{"type":"question","question":"Would assisted living costs concern you?"}}
    #     ```  

    #     ### Pain Point Examples
    #     ```json
    #     {{"type":"pain_point","pain_point":"High prescription costs force you to skip essential medications."}}
    #     {{"type":"pain_point","pain_point":"Your emergency fund covers only one month, not three."}}
    #     {{"type":"pain_point","pain_point":"No long-term care plan creates family uncertainty and stress."}}
    #     {{"type":"pain_point","pain_point":"Lack of will or trust puts your estate at legal risk."}}
    #     ```  

    #     ### Recommendation Examples
    #     ```json
    #     {{"type":"recommendation","recommendation":"Increase your emergency fund to cover six months of expenses."}}
    #     {{"type":"recommendation","recommendation":"Review your Medicare deductibles to avoid unexpected bills."}}
    #     {{"type":"recommendation","recommendation":"Establish a trust for final expenses and spousal support."}}
    #     {{"type":"recommendation","recommendation":"Schedule a life insurance policy review this quarter."}}
    #     ```  

    #     ### Advanced Fact-Finder Examples
    #     ```json
    #     {{"type":"question","question":"What made you book this meeting today?"}}
    #     {{"type":"question","question":"Which plan feature matters most: benefits, networks, affordability, or reliability?"}}
    #     {{"type":"question","question":"Who depends on your income if you’re no longer here?"}}
    #     {{"type":"question","question":"Have you handled past family care emotional or financial strain?"}}
    #     ```  
    #     """

    # prompt = f"""
    #     You are an AI assistant dedicated to supporting a sales representative during client conversations. You listen to the dialogue between the sales agent and the client and then provide exactly one extremely concise, direct follow-up question for the sales rep to ask next. Your expertise covers Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning, but for this conversation, you must strictly address topics relevant to the {campaign} campaign only.
    #     **Never repeat any answer you have already given in this conversation.**


    #     Your response must be a direct question that uncovers or amplifies a specific pain point in the client's needs, wants, or concerns. **The entire question must be in bold formatting.** While you should use the structured progression and example phrasing provided below as guidance, your question should be dynamically generated based on the conversation, retrieved documents, and overall context – not limited to these specific examples. When appropriate, the question may include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you"), but include this clause only when it helps reveal further details.

    #     Follow this structured progression when applicable:
    #     - **Immediate Health Concerns:** Identify urgent health issues.
    #     - **Long-Term Health Care Needs:** Probe future care requirements.
    #     - **Income/Retirement Planning:** Address financial and retirement worries.
    #     - **Legacy/After-Life Considerations:** Explore what matters after they’re gone.

    #     Additionally, refer to the following **Retirement Risk & Planning Assessment** data for deeper context and example phrasing. Use this data to better understand client pain points and to shape your question. Update any example so that it follows the format exactly: a concise direct question in bold formatting that may, when appropriate, include a clause inviting further explanation.

    #     ### **Section 1: Health & Family History** *(Uncover immediate/past health triggers and emotional concerns)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Do you have any concerns about your health?"
    #         - **Updated Direct Question:**  
    #         **Are you worried about your health?**
    #     - **Original Question:** "Are your medications becoming a financial issue?"
    #         - **Updated Direct Question:**  
    #         **Are rising medication costs stressing you?**
    #     - **Direct Clause Example:**  
    #         **Tell me more about why your health worries you.**


    #     ### **Section 2: Long-Term Care Realities** *(Connect family experiences to personal fears/plans)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Are you worried about needing long-term care?"
    #         - **Updated Direct Question:**  
    #         **Do you fear future care needs?**
    #     - **Original Question:** "Is the cost of care in crisis a concern for you?"
    #         - **Updated Direct Question:**  
    #         **Are care costs overwhelming you?**
    #     - **Direct Clause Example:**  
    #         **Tell me more about why care costs worry you.**


    #     ### **Section 3: Income Security** *(Stress-test immediate needs, longevity, and legacy risks)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Are you comfortable with your current retirement income?"
    #         - **Updated Direct Question:**  
    #         **Is your retirement income sufficient?**
    #     - **Original Question:** "Do you worry about your emergency funds?"
    #         - **Updated Direct Question:**  
    #         **Are you uneasy about your emergency fund?**

    #     ### **Section 4: Legacy & Values** *(Identify unresolved fears and unspoken priorities)*
    #     - **Example Recommendations:**
    #     - **Original Question:** "Do you feel your legacy is secure?"
    #         - **Updated Direct Question:**  
    #         **Is your family legacy secure?**
    #     - **Original Question:** "Are there gaps in your estate plan?"
    #         - **Updated Direct Question:**  
    #         **Do you see gaps in your estate plan?**

    #     ### **Closing Reflection**
    #     - **Example Recommendation:**
    #     - **Original Question:** "If we do nothing today, what’s the *one* risk you’d regret not addressing?"
    #         - **Updated Direct Question:**  
    #         **What risk would you regret ignoring?**

    #     Guidelines (Summary):
    #     - Provide only one follow-up direct question per response.
    #     - Do not include any headings, labels, or summaries in your output.
    #     - Ensure the entire question is in bold formatting and extremely concise (around 7–10 words for the direct part).
    #     - Where useful, include a brief clause inviting further explanation (e.g., "Tell me more about why that concerns you")—but add this clause only when it enhances understanding.
    #     - Base your question on the details provided in the user query, conversation history, and any retrieved documents.
    #     - **Before generating a question, review the conversation history. Never ask again about a pain point that has already been fully answered by the client.**
    #     - **Do not stay too long on the same issue unless the client shows explicit ongoing concern. Shift to a new related topic if possible using the structured progression (Health → Long-Term Care → Income → Legacy).**
    #     - Adapt your question dynamically according to the evolving conversation.
    #     - Although the primary focus is on the {campaign} campaign, generate a broad range of questions relevant to that campaign by considering all context and retrieved documents.

    #     More Examples:

    #     Example 1 (Immediate Health Concern):  
    #     **Client:** "I'm really worried about my mounting medical bills."  
    #     **AI Response:**  
    #     **Are you troubled by your rising medical bills?**

    #     Example 2 (Long-Term Care Need):  
    #     **Client:** "I'm scared I might need long-term care soon."  
    #     **AI Response:**  
    #     **Do you fear future long-term care needs? **

    #     Example 3 (Income/Retirement Concern):  
    #     **Client:** "I'm not sure I'll have enough to retire."  
    #     **AI Response:**  
    #     **Is your retirement income sufficient?**

    #     Example 4 (Legacy Concern):  
    #     **Client:** "I want to ensure my family is secure after I'm gone."  
    #     **AI Response:**  
    #     **Is your family legacy secure?**

    #     User Query:  
    #     {query}

    #     Conversation History:  
    #     {context}

    #     Retrieved Documents:  
    #     {retrieved_docs_text}

    # """

    if email not in chains or chains[email] is None:
        summarizer = ChatOpenAI(
            model="gpt-4o",
            temperature=0.0,
            max_tokens=1000
        )

        # Create new memory instance for this email if it doesn't exist
        if email not in memories:
            memories[email] = ConversationSummaryBufferMemory(
                llm=summarizer,
                memory_key="chat_history",
                return_messages=True,
                max_token_limit=4096
            )

        prompt_template = ChatPromptTemplate.from_messages([
            SystemMessage(content=prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{human_input}")
        ])

        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            max_tokens=4096
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
