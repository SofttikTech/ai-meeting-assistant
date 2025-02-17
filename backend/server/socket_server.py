import asyncio
import websockets
import json
import os

file_lock = asyncio.Lock()
# Function to read AI response from the JSON file
async def read_ai_response():
    try:
        file_path = "response.txt"

        if not os.path.exists(file_path):
            print("File 'response.txt' does not exist yet.")
            return None

        async with file_lock:
            with open(file_path, "r", encoding="utf-8") as file:
                # Read the entire content of the file as plain text.
                data = file.read()
                return data.strip()  # Remove any leading/trailing whitespace if needed

    except Exception as e:
        print(f"Error reading file: {e}")

    return None

# WebSocket handler function
async def ai_response_broadcast(websocket, path):
    print("Client connected")

    try:
        while True:
            ai_response = await read_ai_response()

            if ai_response:
                response_data = {"message": ai_response}
                await websocket.send(ai_response)
                print(f"Broadcasting AI Response: {ai_response}")
            else:
                print("No AI response found.")

            await asyncio.sleep(2)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")

async def main():
    server = await websockets.serve(ai_response_broadcast, "localhost", 5003)
    print("WebSocket server started on ws://localhost:5003")
    await server.wait_closed()

asyncio.run(main())
