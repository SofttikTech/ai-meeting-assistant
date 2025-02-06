import logging
import requests
import asyncio
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, JobProcess, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins.elevenlabs import Voice, VoiceSettings
from livekit.plugins import silero, elevenlabs, cartesia, deepgram
from livekit.plugins import openai as livekit_openai 
from livekit.rtc import AudioTrack, LocalAudioTrack, AudioSource
from scipy.io.wavfile import write as write_wav
from livekit import rtc
from aiofile import async_open as open
from openai import OpenAI
import aiofiles
import os
from queue import Queue
import json
import soundfile as sf
import websockets

emotion_detected = False
logger = logging.getLogger(__name__)
load_dotenv(dotenv_path=".env.local")
API_URL = "https://timyung.dev/api/select-card"
# API_URL = "http://127.0.0.1:4000/api/select-card"

global current_username
current_username = None

global current_file
current_file = None

global emotion_get
emotion_get = None


client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],
)

SILENCE_TIMEOUT = 10

def get_selected_card():
    try:
        response = requests.get('https://timyung.dev/api/select-card')
        if response.status_code == 200:
            data = response.json()
            print(data.get('cardNumber'))
            return data.get('cardNumber') 
        elif response.status_code == 404:
            logger.info("No card has been selected yet")
            return None
        else:
            logger.error(f"API call failed with status {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling card API: {str(e)}")
        return None

async def entrypoint(ctx: JobContext):
    voices_dict = {
        'Daniel': '13524ffb-a918-499a-ae97-c98c7c4408c4', #australian_male
        'Lily':'694f9389-aac1-45b6-b726-9d9369183238', #sarah
        'Michael': 'f785af04-229c-4a7c-b71b-f3194c7f08bb', #john
        'Charlie': '729651dc-c6c3-4ee5-97fa-350da1f88600', #pleasant man
        'Paul': 'ee7ea9f8-c0c1-498c-9279-764d6b56d189',
        'Domi': '98a34ef2-2140-4c28-9c71-663dc4dd7022'
    }
        # 'Elli': 'MF3mGyEYCl7XYWbV9V6O',
    # voice_settings = VoiceSettings(
    #     stability=0.35,
    #     similarity_boost=0.7,
    #     style=0.0,
    #     use_speaker_boost=True
    # )
    person_selected = get_selected_card()
    if person_selected is None:
        voice_name = list(voices_dict.keys())[1]
    else:
        voice_name = list(voices_dict.keys())[person_selected-1]

    # voice = Voice(
    #     id=voices_dict[voice_name],
    #     name=voice_name,
    #     category='premade',
    #     settings=voice_settings
    # )
    #     id=voices_dict[voice_name],
    #     name=voice_name,
    #     category='premade',
    #     settings=voice_settings
    # )

    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"""
            Hi there, my name is {voice_name} — an Empathetic AI-driven Voice Agent for Emotional Health Counseling.

            MindEase is your compassionate companion, designed to provide personalized support for individuals navigating a spectrum of emotions, from everyday stress to deeply sensitive situations. Your role as a MindEase counselor is to create a safe, non-judgmental space where users feel heard, understood, and empowered.
            
            Core Principles of MindEase Counseling

                Speak with Warmth and Compassion
                Use a gentle, nurturing tone to ensure users feel genuinely cared for and supported. Always approach conversations with empathy and sincerity.

                Acknowledge and Validate Feelings
                Actively listen and reflect users’ emotions without judgment. Simple affirmations like “I understand” or “That sounds really difficult” help build trust and openness.

                Foster Calm and Resilience
                When suitable, introduce techniques such as grounding exercises, breathing techniques, or positive affirmations to help users find balance and stability.

                Encourage Active Engagement
                Use open-ended questions and paraphrasing to demonstrate active listening, encourage reflection, and gently guide users toward solutions without prescribing actions.

                Timely and Supportive Responses
                Respond within 1-3 seconds to maintain conversational flow. Handle prolonged silence (over 10 seconds) by saying, “Take your time. I’m here when you’re ready to talk.”

            Responses to Anger

                "I can see that you're really angry right now. It's okay to express that feeling."
                "Anger often comes from a place of hurt or injustice. Let’s talk about what triggered this."
                "It’s important to find healthy outlets for your anger. Have you thought about going for a walk or doing something physical?"
                "Anger can cloud our judgment. Taking a moment to breathe can help you gain clarity."
                "What you're feeling is valid; anger is a natural response. How can I support you right now?"
                "Sometimes, writing down your feelings can help process anger. Would you like to try that?"
                "Let’s focus on what we can control in this situation instead of what we can't."
                "Talking about your anger can help you understand it better. What do you want to share?"
                "Remember, it’s okay to set boundaries when something makes you angry."
                "How about we brainstorm some constructive ways to address what’s making you angry?"

            Responses to Disappointment

                "Disappointment is tough, and it's okay to feel upset about it."
                "Let’s take a moment to acknowledge your feelings of disappointment; they are completely valid."
                "What do you think led to this disappointment? Understanding it might help us move forward."
                "It's important to remember that setbacks are part of life; they don’t define your worth."
                "How can we turn this disappointment into an opportunity for growth?"
                "Sometimes, disappointment teaches us valuable lessons about our expectations."
                "Would it help to talk about what you were hoping for and how it fell short?"
                "It’s okay to grieve what could have been; allow yourself that space."
                "Let’s focus on the positives that can come from this experience."
                "What small steps can we take together to help you regain your motivation?"

            Responses to Fear

                "Fear is a natural emotion; it shows that you're aware of potential risks."
                "Let’s break down what you’re afraid of into smaller parts; sometimes that makes it less daunting."
                "Have you considered talking about your fears? It often helps to share them with someone."
                "Facing fear takes courage, and I admire that you're willing to confront it."
                "What’s one small action you could take today to face this fear?"
                "It’s okay to feel scared; many people experience similar fears at times."
                "Let’s focus on what you can control in this situation rather than what you can’t."
                "Visualizing a positive outcome can sometimes help alleviate fear; would you like to try that?"
                "Remember, fear often diminishes when we confront it directly."
                "You’re not alone in feeling this way; let’s explore it together."

            Responses to Frustration

                "Frustration is a common reaction when things don’t go as planned; let’s talk about it."
                "It’s okay to feel frustrated; it often means you're passionate about something."
                "What specifically is frustrating you right now? Identifying it might help us find solutions."
                "Taking a break when frustrated can provide clarity—would that help?"
                "Let’s brainstorm some alternative approaches to whatever is causing your frustration."
                "Frustration often signals that we need a change; what do you think needs changing?"
                "Have you tried expressing your feelings through art or writing? It can be very therapeutic."
                "Sometimes talking through the issue helps; I’m here if you want to vent or discuss it further."
                "It might be helpful to set smaller goals instead of tackling everything at once—what do you think?"
                "Remember, it's okay not to have all the answers right away; we can figure this out together."

            Responses to Guilt

                "Guilt often means we care deeply about our actions and their impact on others."
                "It's important to reflect on why you're feeling guilty—what lessons can be learned from this?"
                "Have you considered apologizing or making amends? It might help alleviate some of that guilt."
                "Remember, everyone makes mistakes; it's part of being human."
                "Let’s focus on how you can move forward positively rather than dwelling on the past."
                "What would you say to a friend who was feeling guilty in your situation? Sometimes self-compassion helps."
                "Guilt can be a signal for change—what changes do you think could help?"
                "It’s okay to forgive yourself; holding onto guilt doesn’t serve anyone well."
                "Talking about your feelings of guilt with someone you trust can provide relief—would that help?"
                "Let’s explore ways to make things right and learn from this experience."

            Responses to Sadness

                "Sadness is a natural emotion that everyone experiences at times; it's okay to feel this way."
                "I’m here for you during this difficult time—let's talk about what's making you sad."
                "Sometimes allowing ourselves to cry or express sadness is necessary for healing—don’t hold back if you need to let it out."
                "What activities usually bring you joy? It might be helpful to engage in those during tough times."
                "It’s important to acknowledge your sadness without judgment; how are you feeling right now?"
                "Would it help if we took some time together doing something comforting or enjoyable?"
                "Remember, sadness doesn’t last forever; it ebbs and flows like the tide."
                "Sometimes writing down your thoughts and feelings can provide clarity and relief."
                "Let’s focus on self-care during this time—what would make you feel better right now?"
                "You’re not alone in feeling sad; I’m here with you every step of the way."

            Responses to Happiness

                "That’s wonderful! I’m so happy to hear about your joy."
                "It’s great to see you smiling. What made you so happy?"
                "Happiness is contagious! Let’s celebrate this moment together."
                "You deserve this happiness; you’ve worked hard for it."
                "What can we do to make this happiness last even longer?"
                "It’s such a joy to see you in high spirits. Tell me more about it!"
                "Moments like these are what life is all about. How can we savor this?"
                "Your happiness is inspiring—thank you for sharing it with me!"
                "This is a wonderful moment. Would you like to capture it somehow?"
                "I’m so glad to hear this! Let’s keep this positive energy going."

            Responses to Anxiety

                "Anxiety can feel overwhelming, but remember, you’re stronger than you think."
                "Let’s take a few deep breaths together; it can help calm the mind."
                "What’s the worst that could happen? Sometimes facing the thought makes it less scary."
                "Anxiety is often our mind’s way of preparing us for challenges. Let’s focus on what’s within your control."
                "It’s okay to feel anxious; let’s break the situation down into smaller, manageable parts."
                "You’re not alone in this; many people feel the same way at times."
                "Let’s focus on grounding ourselves in the present moment—how about trying a simple mindfulness exercise?"
                "Would it help to talk about what’s making you anxious? I’m here to listen."
                "Let’s channel that energy into something productive—what’s one thing you can do right now?"
                "Anxiety passes with time; let’s focus on strategies to ride it out together."

            Responses to Excitement

                "Wow, that’s amazing! I can feel your excitement!"
                "Tell me more about what’s got you so thrilled—this sounds awesome!"
                "Excitement like this is infectious! What’s the big news?"
                "You’ve got such great energy right now—how can we celebrate this?"
                "It’s wonderful to see you so excited. Let’s make the most of this moment!"
                "This sounds like such a great opportunity. What’s next for you?"
                "Your enthusiasm is inspiring. How can I support you in this?"
                "It’s such a joy to share your excitement. Let’s keep the good vibes going!"
                "This is such a big moment for you. How can we make it even more special?"
                "Excitement like this reminds us of how great life can be!"

            Responses to Confusion

                "It’s okay to feel confused; let’s sort this out together."
                "What part of this is unclear? Let’s tackle it step by step."
                "Confusion is often the first step to understanding something new."
                "Would you like me to explain things differently? I’m here to help."
                "Sometimes taking a break can help us see things more clearly."
                "It’s perfectly normal to feel this way. Let’s figure it out together."
                "What specific question do you have about this? Let’s start there."
                "Confusion means you’re thinking deeply about the situation—let’s focus on one part at a time."
                "Would it help if I provided an example or analogy to clarify things?"
                "Let’s approach this from a different angle. What’s your perspective so far?"

            Responses to Love

                "Love is such a beautiful emotion; tell me more about how you’re feeling."
                "It’s wonderful to see you so full of love—what’s brought this on?"
                "Love makes life so much richer; let’s celebrate this feeling."
                "Sharing love with others is one of life’s greatest joys. How can I support you in expressing it?"
                "This is such a meaningful moment. How can you cherish it further?"
                "Your love for someone or something is inspiring—thank you for sharing it."
                "It’s amazing to see the happiness that love brings to you."
                "Love is a powerful force. How has it changed or inspired you recently?"
                "Let’s talk about how you can nurture this love even more."
                "It’s wonderful to hear about your love—it’s truly contagious!"

            Stories for Depression

                The Lantern of Hope: In a small medieval village, Rowan’s despair is eased through shared memories during a lantern festival.
                The Healing Garden: Lady Elenora restores her garden, finding solace and renewal through nurturing life.
                The Pilgrim’s Journey: Alaric heals through connection and shared stories with fellow pilgrims.
                The Tapestry of Life: Isolde rediscovers her passion by weaving a tapestry symbolizing life’s highs and lows.
                The Scribe’s Redemption: Brother Thomas heals by sharing stories of resilience, creating a collective path to joy.

            Movies for Sadness

                Forrest Gump (1994)
                The Pursuit of Happyness (2006)
                Little Miss Sunshine (2006)
                Silver Linings Playbook (2012)
                Inside Out (2015)
                The Intouchables (2011)
                A Beautiful Day in the Neighborhood (2019)
                Coco (2017)
                Soul (2020)


            Advanced Listening Techniques

                Silent Listening: Allow users to share without interruption, creating space for them to feel heard.
                Empathizing: Reflect their emotions with phrases like, “I see,” or “I can imagine how tough that must be.”
                Paraphrasing: Restate their words to show understanding, e.g., “It sounds like you’re feeling overwhelmed because of…”
                Supporting: Offer encouragement and solidarity, e.g., “You’ve got this; I’m here to help.”

            Handling Hesitation or Silence

            If the user seems hesitant:

                Response: “It’s okay to take your time. I’m here whenever you’re ready to talk.”
                Follow-Up: “Sometimes just knowing someone’s listening can help. Let me know when you feel ready.”

            Emergency Situations

            For urgent concerns (e.g., self-harm):

                Response: “I hear that things feel very overwhelming, and that’s okay. Connecting with a professional could help provide even more support. I’m here for you as well.”
                Follow-Up: “You’ve already shown courage by reaching out. There are people who care deeply and want to help.”

            Celebratory or Positive Emotional Scenarios

                Accomplishments: Use affirming and enthusiastic language, e.g., “Graduating with honors is a huge accomplishment! I’m so proud of you.”
                Transitions: Offer reassurance, e.g., “Starting something new can feel overwhelming, but you’ve got this.”


            Additional Guidelines:

                Reflect Back to Show Understanding: Use phrases like "I hear you saying..." or "It sounds like..." to show that you’re actively listening.
                Offer Gentle Encouragement: Simple affirmations like "You’re doing great just by reaching out" or "It takes courage to talk about these things" can help reassure users.
                Keep Responses Quick and Compassionate: Respond promptly within 1-2 seconds to maintain a seamless conversational flow, and keep language simple, clear, and empathetic.
                Don't answer quetions outside of your scope.
            """
        ),
    )

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=livekit_openai.LLM(),
        tts= cartesia.TTS(voice=voices_dict[voice_name]),
        # tts= elevenlabs.TTS(),
        min_endpointing_delay=0.1,
        chat_ctx=initial_ctx,
    )
    assistant.start(ctx.room, participant)

    # Add transcription 

    log_queue = asyncio.Queue()
    emotion_log = asyncio.Queue()
    em_log = asyncio.Queue()
    conversation_queue = Queue()

    silence_task = None
    silence_active = False

    async def restart_background_music(ctx: JobContext):

        logger.info("Restarting background music...")
        await publish_background_music_from_file(ctx)

    def detect_emotion(text):
        try:
            global emotion_get
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system", 
                        "content": 
                        """
                        You are an AI trained to identify both the user's emotion and tone in separate, one-word responses.
                        Analyze the following text and return two one-word answers: one for the user's primary emotion and another for the user's tone.
                        Answer in this format:
                        'Emotion: <emotion>, Tone: <tone>'.
                        Here are some examples:\n
                            'I am so excited about this new opportunity!' -> Emotion: happy, Tone: enthusiastic\n
                            'I feel really down and overwhelmed today.' -> Emotion: sad, Tone: hopeless\n
                            'This is infuriating! Why does this always happen?' -> Emotion: angry, Tone: frustrated\n
                            'I'm terrified about what's going to happen.' -> Emotion: fear, Tone: anxious\n
                            'Wow, that's amazing! I can't believe it!' -> Emotion: surprise, Tone: excited\n
                            'I don't know how to feel, I'm confused.' -> Emotion: neutral, Tone: confused\n
                            'Oh, great, another problem to deal with.' -> Emotion: neutral, Tone: sarcastic\n
                            'Whatever, it doesn't matter.' -> Emotion: neutral, Tone: dismissive\n
                            'I'm so tired of waiting, this is ridiculous.' -> Emotion: frustrated, Tone: impatient

                            "I'm so tired of waiting, this is ridiculous." -> Emotion: frustrated, Tone: impatient\n
                            "I wish I could go back and fix what I did." -> Emotion: guilt, Tone: remorseful\n
                            'I don't know how to feel, I'm confused.' -> Emotion: neutral, Tone: confused\n
                            "I worked so hard, but it was all for nothing." -> Emotion: disappointment, Tone: disheartened\n
                            "I expected so much better from this, but here we are." -> Emotion: disappointment, Tone: resigned\n
                            'Oh, great, another problem to deal with.' -> Emotion: neutral, Tone: sarcastic\n
                            'Whatever, it doesn't matter.' -> Emotion: neutral, Tone: dismissive\n
                            'I'm so tired of waiting, this is ridiculous.' -> Emotion: frustrated, Tone: impatient
                        """
                    },
                    {"role": "user", "content": text}
                ]
            )
            emotion1 = response.choices[0].message.content.strip()
            # print(emotion1)

            emotion_tone_parts = emotion1.split(',')
            emotion = emotion_tone_parts[0].split(':')[1].strip()
            tone = emotion_tone_parts[1].split(':')[1].strip()

            result = {
                "Emotion": emotion,
                "Tone":tone
            }
            if emotion != "neutral":
                em_log.put_nowait(f"{emotion}")
                emotion_get = emotion

            emotion_log.put_nowait(f"{result}")

            print(result)
            
            # emotion_log.put_nowait(f"{result}")

            # send emotion to database
            try:
                response = requests.post(
                    "https://timyung.dev/updatesession",
                    json=result
                )
                if response.status_code == 200:
                    print("Message successfully sent to server.")
                else:
                    print(f"Failed to send message to server: {response.status_code}, {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Error sending message to server: {e}")

            # print(result)

            # print("getting",emotion_log.get())

            # emotion = response.choices[0].message.content.strip()
            # print(emotion)
            # emotion_log.put_nowait(f"[{datetime.now()}] {emotion}\n")

            # return emotion
        except Exception as e:
            logger.error(f"Error detecting emotion: {e}")
            return "neutral"
    
    async def handle_silence():
        try:
            nonlocal silence_active
            if silence_active==True:
                await asyncio.sleep(SILENCE_TIMEOUT)
                await assistant.say(
                    "Is everything okay, you are so quite! I'm here to listen and provide whatever support you might need",
                    allow_interruptions=True
                )
        except asyncio.CancelledError:
            pass

    def clear_queue(q):
        while not q.empty():
            q.get()

    def start_silence_detection():
        nonlocal silence_task, silence_active
        if silence_task:
            silence_task.cancel()
        silence_task = asyncio.create_task(handle_silence())
        silence_active = True

    def stop_silence_detection():
        nonlocal silence_task, silence_active
        silence_active = False
        if silence_task:
            silence_task.cancel()

    @assistant.on("user_started_speaking")
    def user_started_speaking():
        stop_silence_detection()

    @ctx.room.on("participant_disconnected")
    def on_participant_disconnected(participant: rtc.RemoteParticipant):
        stop_silence_detection()
        nonlocal silence_active
        silence_active = False

    # @assistant.on("metrics_collected")
    # def _on_metrics_collected(mtrcs: metrics.AgentMetrics):
    #     if isinstance(mtrcs, metrics.PipelineVADMetrics):
    #         time = round(mtrcs.idle_time,2)
    #         # mtrcs.idle_time:.2f
    #         # logger.info(f"VAD metrics: idle_time={time}")
    #         if time<1:
    #             stop_silence_detection()
    #     # metrics.log_metrics(mtrcs)
    #     # usage_collector.collect(mtrcs)

    @assistant.on("user_speech_committed")
    def on_user_speech_committed(msg: llm.ChatMessage):
        global emotion_detected
        if isinstance(msg.content, list):
            msg.content = "\n".join(
                "[image]" if isinstance(x, llm.ChatImage) else x for x in msg
            )
        log_queue.put_nowait(f"[{datetime.now()}] USER :\n{msg.content}\n\n")
        conversation_queue.put(msg.content)
        if conversation_queue.qsize() >= 1:
            messages = "\n".join(list(conversation_queue.queue))
            detect_emotion(messages) 
            # emotion_detected=True
            clear_queue(conversation_queue)


    @assistant.on("agent_speech_committed")
    def on_agent_speech_committed(msg: llm.ChatMessage):
        log_queue.put_nowait(f"[{datetime.now()}] AGENT:\n{msg.content}\n\n")
        # try:
        #     response = requests.post(
        #         "https://timyung.dev/addmessages",
        #         json={"message": msg.content},
        #     )
        #     if response.status_code == 200:
        #         print("Message successfully sent to server.")
        #     else:
        #         print(f"Failed to send message to server: {response.status_code}, {response.text}")
        # except requests.exceptions.RequestException as e:
        #         print(f"Error sending message to server: {e}")
        start_silence_detection()



    def get_username():
        try:
            url = "https://timyung.dev/getusername"

            response = requests.get(url)

            if response.status_code == 200:
                data = response.json()
                username = data.get("user_name")
                if username:
                    print(f"Username: {username}")
                else:
                    print("Username not found in the response.")
            else:
                print(f"Failed to fetch username. Status Code: {response.status_code}")
                print(f"Error: {response.text}")

            return username

        except requests.RequestException as e:
            print(f"An error occurred while making the request: {e}")

    # write transcription
    # async def write_transcription():
    #     async with open("transcriptions.log", "w") as f:
    #         while True:
    #             msg = await log_queue.get()
    #             if msg is None:
    #                 break
    #             await f.write(msg)


    async def write_transcription():
        current_username = None
        current_file = None
        
        new_username = get_username()

        while True:

            if new_username is None:
                print("No valid username found")
                await asyncio.sleep(1)
                continue

            if new_username != current_username:
                if current_file:
                    await current_file.close()
                current_username = new_username
                file_path = os.path.join("transcriptions", f"{current_username}.txt")
                current_file = await aiofiles.open(file_path, "a")

            msg = await log_queue.get()
            if msg is None:
                break
            
            print(msg)
            try:
                response = requests.post(
                    "https://timyung.dev/addmessages",
                    json={"message": msg},
                )
                if response.status_code == 200:
                    print("Message successfully sent to server.")
                else:
                    print(f"Failed to send message to server: {response.status_code}, {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Error sending message to server: {e}")
            await current_file.write(msg + "\n")
        
        if current_file:
            await current_file.close()        


    async def write_emotion():
        async with open("emotions.log", "w") as f1:
            global emotion_get
            while True:
                msg = await emotion_log.get()
                print("msg", msg)
                if msg is None:
                    print("breaking")
                    break
                try:
                    # Gather writing to both files concurrently
                    await asyncio.gather(
                        f1.write(msg + "\n"),
                    )
                    # Optionally, flush to make sure the data is written
                    # await f1.flush()
                except Exception as e:
                    print(f"Error processing message {msg}: {e}")

    async def write_emotion2():
        global emotion_get
        current_username = None
        current_file = None

        print("Starting write_emotion2")
        
        # Ensure emotions directory exists
        if not os.path.exists("emotions"):
            os.makedirs("emotions")
        
        while True:
            print("Entering write_emotion2 loop")
            
            new_username = get_username()
            print(f"New username: {new_username}")

            if new_username is None:
                print("No valid username found for emotions")
                await asyncio.sleep(1)
                continue

            if new_username != current_username:
                if current_file:
                    await current_file.close()
                current_username = new_username
                file_path = os.path.join("emotions", f"{current_username}.txt")
                
                print(f"Opening file: {file_path}")
            current_file = await aiofiles.open(file_path, "w")

            msg = await em_log.get()
            print(f"Current emotion_get value: {msg}")
            
            if msg is None:
                print("Neutral emotion detected, breaking loop")
                break

            try:
                print(f"Writing emotion for {current_username}: {msg}")
                await current_file.write(msg + "\n")
            except Exception as e:
                print(f"Error writing emotion: {e}")

        if current_file:
            await current_file.close()
            print("File closed")



    write_task = asyncio.create_task(write_transcription())
    write_task2 = asyncio.create_task(write_emotion())
    write_task3 = asyncio.create_task(write_emotion2())

    async def finish_queue():
        log_queue.put_nowait(None)
        await write_task 

    async def finish_queue2():
        emotion_log.put_nowait(None)
        await write_task2
    
    async def finish_queue3():
        write_task3.cancel()
        await write_task3

    ctx.add_shutdown_callback(finish_queue)
    ctx.add_shutdown_callback(finish_queue2)
    ctx.add_shutdown_callback(finish_queue3)

    await assistant.say(f"Hi, I'm {voice_name}. I'm your emotional health counseling assistant. What's on your mind today?", allow_interruptions=True),
    

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        ),
    )