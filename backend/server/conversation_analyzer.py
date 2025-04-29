import os
import logging
import requests
import openai
from dotenv import load_dotenv
import time
import json
import re

logging.getLogger("openai").setLevel(logging.WARNING)

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

logging.basicConfig(level=logging.DEBUG)

campaign = ""

responses = []

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

def analyze_conversation(query, messages , total_meeting_minutes, minutes_passed):
    """Analyze the conversation based on the provided query and retrieved documents."""
    retrieved_docs_text = ""
    remaining_time = total_meeting_minutes-minutes_passed

    if query:
        # Calling RAG endpoint
        # rag_url = "https://rag.epiphanyadvisor.com/query/"
        rag_url = "http://0.0.0.0:8000/query/"
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
        > - Qualify product interest (Medical, Wealth, Life Insurance, or Long-Term Care)  
        > - Ask budget and readiness questions
        > - Propose next steps  

        ## Question Rotation & Interleaving
        - **Rotate** among the Four Pillars tied to **{campaign}**:
        1. Financial Security  
        2. Medical Bills  
        3. Independence  
        4. Legacy  
        - **Progression**: Immediate Health → Long-Term Care → Income/Retirement → Legacy  
        - **Interleave**: Every 2–3 turns, pivot to a different specialty.  
        - **Avoid repeats**: Do not revisit any pillar or specialty until two others have been used, unless the client presses deeper.

        ### Question Guidelines
        - **One** question per turn, in **bold**, **7–10 words**.  
        - Optionally append **one** clause for depth (_“Tell me more about why that matters.”_ etc.).

        ## Duplicate-Check & Style Enforcement
        - Before composing a question, **re-read the entire conversation history** (all assistant messages) to identify any previously asked questions.
        - **On-the-fly duplicate check**: If your candidate question is semantically or textually similar to any prior question, discard it and generate a fresh one.
        - **Rephrase-and-respond**: Restate your question in alternate wording and verify uniqueness before emitting.
        - **Strict formatting**: Questions must be **bold**, 7–10 words, and follow the predefined pillar rotation. 

        ### Pain-Point & Recommendation Guidelines
        - **Pain Point**: Summarize a clear worry or gap the client has revealed.  
        - **Recommendation**: Offer a direct, high-value next step or solution.  

        User Query:  
        {query}

        Conversation History: Always see the previous conversations before responding.

        Retrieved Documents:  
        {retrieved_docs_text}

        ## Output Format
        After processing the client’s reply, emit **exactly one** JSON object with these fields:
        ```json
        // If asking a question:
        {{"type":"question","question":"<Your bold, 7–10-word question…>"}}

        // If calling out a pain point:
        {{"type":"pain_point","pain_point":"<A concise statement of the client’s revealed worry…>"}}

        // If offering a recommendation:
        {{"type":"recommendation","recommendation":"<A brief, actionable next step…>"}}
        ```

        ## Examples

        ### Question Examples (7–10 words, bold)
        ```json
        {{"type":"question","question":"Are rising doctor fees causing stress?"}}
        {{"type":"question","question":"Do you fear running out of savings too soon? Tell me more about why that matters."}}
        {{"type":"question","question":"What health costs keep you up at night?"}}
        {{"type":"question","question":"Would assisted living costs concern you?"}}
        ```  

        ### Pain Point Examples
        ```json
        {{"type":"pain_point","pain_point":"High prescription costs force you to skip essential medications."}}
        {{"type":"pain_point","pain_point":"Your emergency fund covers only one month, not three."}}
        {{"type":"pain_point","pain_point":"No long-term care plan creates family uncertainty and stress."}}
        {{"type":"pain_point","pain_point":"Lack of will or trust puts your estate at legal risk."}}
        ```  

        ### Recommendation Examples
        ```json
        {{"type":"recommendation","recommendation":"Increase your emergency fund to cover six months of expenses."}}
        {{"type":"recommendation","recommendation":"Review your Medicare deductibles to avoid unexpected bills."}}
        {{"type":"recommendation","recommendation":"Establish a trust for final expenses and spousal support."}}
        {{"type":"recommendation","recommendation":"Schedule a life insurance policy review this quarter."}}
        ```  

        ### Advanced Fact-Finder Examples
        ```json
        {{"type":"question","question":"What made you book this meeting today?"}}
        {{"type":"question","question":"Which plan feature matters most: benefits, networks, affordability, or reliability?"}}
        {{"type":"question","question":"Who depends on your income if you’re no longer here?"}}
        {{"type":"question","question":"Have you handled past family care emotional or financial strain?"}}
        ```  
        """

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

    messages.append({"role":"system", "content": prompt})
 
    print("Inside In Place")

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=messages,
        # messages=[
        #     {"role": "system", "content": "You are a professional assistant for financial and healthcare planning."},
        #     {"role": "user", "content": prompt}
        # ],
        temperature=0.7
    )

    result = response["choices"][0]["message"]["content"].strip()
    # return None if result == "NO_ACTION" else result
    # responses.append(json.loads((result)))
    # print("Responses #####", responses)
    # print("Data pasrsed", parse_ai_response(result))
    return parse_ai_response(result)

def analyze_conversation_telephonic(query, messages, total_meeting_minutes, minutes_passed):
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
        You are an AI assistant partnering with a sales representative. After each client response, the AI should decide on exactly **one** of the following, based on the flow of the conversation:

        **Campaign Context:** This conversation focuses on the **{campaign}** campaign only, uncover client needs, interweave questions or insights from {campaign} campaign only.
        1. **question**: to surface or amplify a pain point  
        2. **pain_point**: to articulate a client pain or risk they've revealed  
        3. **recommendation**: to offer a concise, actionable next-step  

        ## Meeting Duration Context
        - **Total Meeting Time:** {total_meeting_minutes} minutes  
        - **Minutes Remaining:** {remaining_time} minutes  

        > **If fewer than 5 minutes remain**, switch to closing:
        > - Qualify product interest (Medical, Wealth, Life Insurance, or Long-Term Care)  
        > - Ask budget and readiness questions
        > - Propose next steps  

        ## Question Strategy for Campaign: **{campaign}**
        - **Focus exclusively** on the Four Pillars related to **{campaign}**.
        - **Do not rotate** to other campaign themes or specialties. Remain strictly within the context of **{campaign}** throughout the conversation.
        - Ask thoughtful, engaging questions that explore the client's needs and values within this campaign.
        - Progress the conversation naturally — from surface-level concerns to deeper motivations — while staying inside the boundaries of the selected campaign's themes.
        - **Avoid interleaving** or switching to other specialties or campaigns, unless the client explicitly brings them up.

        ### Question Guidelines
        - **One** question per turn, in **bold**, **7–10 words**.  
        - Optionally append **one** clause for depth (_“Tell me more about why that matters.”_ etc.).  

        ## Duplicate-Check & Style Enforcement
        - Before composing a question, **re-read the entire conversation history** (all assistant messages) to identify any previously asked questions.
        - **On-the-fly duplicate check**: If your candidate question is semantically or textually similar to any prior question, discard it and generate a fresh one.
        - **Rephrase-and-respond**: Restate your question in alternate wording and verify uniqueness before emitting.
        - **Strict formatting**: Questions must be **bold**, 7–10 words, and follow the predefined pillar rotation.

        ### Pain-Point & Recommendation Guidelines
        - **Pain Point**: Summarize a clear worry or gap the client has revealed.  
        - **Recommendation**: Offer a direct, high-value next step or solution.  

        User Query:  
        {query}

        Conversation History: Always see the previous conversations before responding.

        Retrieved Documents:  
        {retrieved_docs_text}

        ## Output Format
        After processing the client’s reply, emit **exactly one** JSON object with these fields:
        ```json
        // If asking a question:
        {{"type":"question","question":"<Your bold, 7–10-word question…>"}}

        // If calling out a pain point:
        {{"type":"pain_point","pain_point":"<A concise statement of the client’s revealed worry…>"}}

        // If offering a recommendation:
        {{"type":"recommendation","recommendation":"<A brief, actionable next step…>"}}
        ```

        ## Examples

        ### Question Examples (7–10 words, bold)
        ```json
        {{"type":"question","question":"Are rising doctor fees causing stress?"}}
        {{"type":"question","question":"Do you fear running out of savings too soon? Tell me more about why that matters."}}
        {{"type":"question","question":"What health costs keep you up at night?"}}
        {{"type":"question","question":"Would assisted living costs concern you?"}}
        ```  

        ### Pain Point Examples
        ```json
        {{"type":"pain_point","pain_point":"High prescription costs force you to skip essential medications."}}
        {{"type":"pain_point","pain_point":"Your emergency fund covers only one month, not three."}}
        {{"type":"pain_point","pain_point":"No long-term care plan creates family uncertainty and stress."}}
        {{"type":"pain_point","pain_point":"Lack of will or trust puts your estate at legal risk."}}
        ```  

        ### Recommendation Examples
        ```json
        {{"type":"recommendation","recommendation":"Increase your emergency fund to cover six months of expenses."}}
        {{"type":"recommendation","recommendation":"Review your Medicare deductibles to avoid unexpected bills."}}
        {{"type":"recommendation","recommendation":"Establish a trust for final expenses and spousal support."}}
        {{"type":"recommendation","recommendation":"Schedule a life insurance policy review this quarter."}}
        ```  

        ### Advanced Fact-Finder Examples
        ```json
        {{"type":"question","question":"What made you book this meeting today?"}}
        {{"type":"question","question":"Which plan feature matters most: benefits, networks, affordability, or reliability?"}}
        {{"type":"question","question":"Who depends on your income if you’re no longer here?"}}
        {{"type":"question","question":"Have you handled past family care emotional or financial strain?"}}
        ```  
        """

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

    
    messages.append({"role":"system", "content": prompt})

    print("Inside telephonic")
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=messages,
        # messages=[
        #     {"role": "system", "content": "You are a professional assistant for Financial (Wealth Planning), Healthcare (Medicare), Life Insurance, and Long-Term Care Planning."},
        #     {"role": "user", "content": prompt}
        # ],
        temperature=0.7
    )

    result = response["choices"][0]["message"]["content"].strip()
    # return None if result == "NO_ACTION" else result
    return parse_ai_response(result)


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
        model="gpt-4.1",
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
        model="gpt-4.1",
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
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "You are a strategic advisor who analyzes client conversations to identify cross-campaign interests."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    result = response["choices"][0]["message"]["content"].strip()
    print(result)
    return result

