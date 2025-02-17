import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import io from "socket.io-client";


const SERVER_URL = "http://localhost:5001";

const Talk = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("Waiting for transcription...");
  const [ai_response, setAIResponse] = useState("");
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalIdRef = useRef(null);
  const socketRef = useRef(null);

  const lastMessageRef = useRef("");

  useEffect(()=>{
    const socket = io('http://localhost:5001');

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('ai_update', (data) => {
        console.log('AI Analysis:', data);
        
        const newMessage = data.trim();
        

        if (lastMessageRef.current === newMessage) {
          return;
        }
          
        lastMessageRef.current = newMessage;
          
        setAIResponse((prevResponse) =>
          prevResponse ? prevResponse + "\n" + data : data
        );

    });

    socket.on('status', (data) => {
        console.log('Server status:', data.message);
    });
  })

  // useEffect(() => {
  //   // Connect to the WebSocket server
  //   socketRef.current = new WebSocket("ws://localhost:5003");

  //   socketRef.current.onopen = () => {
  //     console.log("Connected to WebSocket Server");
  //   };

  //   socketRef.current.onmessage = (event) => {
  //     try {
  //       // const data = JSON.parse(event.data);
  //       // if (data.message) {
  //         // Trim the new message for consistent comparison
  //       const newMessage = event.data.trim();

  //         // Check if the new message is identical to the last one
  //       if (lastMessageRef.current === newMessage) {
  //         return; // Do not update if it’s a duplicate
  //         }
          
  //         // Update the ref with the new message
  //       lastMessageRef.current = newMessage;
          
  //         // Update the UI state with the new message appended
  //       setAIResponse((prevResponse) =>
  //         prevResponse ? prevResponse + "\n" + event.data : event.data
  //       );
  //     } catch (error) {
  //       console.error("Error parsing WebSocket message:", error);
  //     }
  //   };

  //   socketRef.current.onerror = (error) => {
  //     console.error("WebSocket Error:", error);
  //   };

  //   socketRef.current.onclose = () => {
  //     console.log("WebSocket Connection Closed");
  //   };

  //   // Cleanup on component unmount
  //   return () => {
  //     if (socketRef.current) {
  //       socketRef.current.close();
  //     }
  //   };
  // }, []);


  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startAgent = async () => {
    try {
      setIsRecording(true);
      setAIResponse("");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
        // mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Received chunk of size: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
          console.log(`Total chunks: ${audioChunksRef.current.length}`);
        }
      };

      mediaRecorderRef.current.start(1000);
      console.log("Recording started with 1-second intervals");

      // Send audio every 10 seconds
      intervalIdRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          console.log(`Sending ${audioChunksRef.current.length} chunks to backend`);
          sendAudioToBackend();
        }
      }, 30000);

    } catch (error) {
      console.error("Error starting agent:", error);
      setIsRecording(false);
    }
  };

  const stopAgent = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped");
      
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      if (audioChunksRef.current.length > 0) {
        console.log(`Sending final ${audioChunksRef.current.length} chunks`);
        sendAudioToBackend();
      }

      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("No audio chunks to send");
      return;
    }

    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: "audio/webm" 
      });
      
      console.log(`Created blob of size: ${audioBlob.size} bytes`);

      // For debugging: Save the audio file locally
      saveAs(audioBlob, `conversation-${Date.now()}.webm`);

      const formData = new FormData();
      formData.append("audio", audioBlob, "conversation.webm");

      const response = await axios.post(`${SERVER_URL}/transcribe`, formData);
      setTranscript(response.data.transcript);
      console.log("Transcription received:", response.data.transcript);

      // Clear chunks after successful send
      audioChunksRef.current = [];
      
    } catch (error) {
      console.error("Error sending audio:", error);
    }
  };

  const responseStyle = {
    whiteSpace: "pre-wrap",    
    wordWrap: "break-word",    
    overflowX: "hidden",
    padding: "10px",           
    // border: "1px solid #ccc",
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Live Conversation Recording</h1>
        
        <div className="space-x-4 mb-6">
          <button
            onClick={startAgent}
            disabled={isRecording}
            className={`px-4 py-2 rounded-md ${
              isRecording 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-black'
            }`}
          >
            Start Recording
          </button>
          
          <button
            onClick={stopAgent}
            disabled={!isRecording}
            className={`px-4 py-2 rounded-md ${
              !isRecording 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-green'
            }`}
          >
            Stop Recording
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Live Suggestions from LLM:</h3>
          <div className="p-4 bg-gray-50 rounded-md min-h-[100px] whitespace-pre-wrap">
          <pre style={responseStyle}>
          {ai_response || "Waiting for AI Response...."}
          </pre>
          </div>
        </div>


        {/* {isRecording && (
          <div className="mt-4 text-sm text-gray-600">
            Recording in progress... {audioChunksRef.current.length} chunks collected
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Talk;

