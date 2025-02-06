import asyncio
import websockets
import json
import requests

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

async def read_emotion_from_file():
    try:
        name = get_username()
        if name is None:
            raise ValueError("Username could not be retrieved.")

        with open(f"emotions/{name}.txt", "r") as file:
            lines = file.readlines()
            if lines:
                return lines[-1].strip()
            else:
                return None
    except Exception as e:
        print(f"Error reading emotion from file: {e}")
        return None

async def emotion_broadcast(websocket, path):
    print("Client connected")
        
    try:
        while True:
            # Read the emotion from the file
            current_emotion = await read_emotion_from_file()
            if current_emotion:
                emotion_data = {
                    "emotion": current_emotion
                }
                await websocket.send(json.dumps(emotion_data))  # Send emotion data to client
                print(f"Broadcasting emotion: {current_emotion}")
            else:
                print("No emotion data found in the file.")
            
            await asyncio.sleep(5)  # Wait for 5 seconds before sending next emotion
    except Exception as e:
        print(f"Error: {e}")
    finally:
        print("Client disconnected")

# Start the WebSocket server on localhost:8080
async def main():
    server = await websockets.serve(emotion_broadcast, "localhost", 8080)
    print("WebSocket server started on ws://localhost:8080")
    await server.wait_closed()

# Run the WebSocket server
asyncio.run(main())
