import axios from "axios";
import io from "socket.io-client";
import { saveAs } from "file-saver";
import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import "react-table-6/react-table.css";
import "./index.css";
import { URL } from "../../store/config";

const SERVER_URL = URL;

const Talk = ({ setIsVisibleAssistant }) => {
  const history = useHistory();
  const [summary, setSummary] = useState('');
  const [ai_response, setAIResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("Waiting for transcription...");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalIdRef = useRef(null);
  const socketRef = useRef(null);
  const lastMessageRef = useRef("");
  const lastTranscriptRef = useRef("");

  // Socket initialization for real-time updates.
  useEffect(() => {
    const socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.log("Connected to server");
    });
    socket.on("update", (data) => {
      if (data.ai_response) {
        const newAIMessage = data.ai_response.trim();
        if (lastMessageRef.current !== newAIMessage) {
          lastMessageRef.current = newAIMessage;
          setAIResponse((prev) =>
            prev ? prev + "\n" + data.ai_response : data.ai_response
          );
        }
      }
      if (data.transcript) {
        const newTranscript = data.transcript.trim();
        if (lastTranscriptRef.current !== newTranscript) {
          lastTranscriptRef.current = newTranscript;
          setTranscript((prev) =>
            prev === "Waiting for transcription..."
              ? data.transcript
              : prev + "\n" + data.transcript
          );
        }
      }
    });
    socket.on("status", (data) => {
      console.log("Server status:", data.message);
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Reset states and clear any previous data.
      setIsProcessing(false);
      setIsRecording(true);
      setAIResponse("");
      setTranscript("Waiting for transcription...");
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Received chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.start(1000);
      console.log("Recording started");

      // Periodically send audio chunks every 10 seconds.
      intervalIdRef.current = setInterval(() => {
        if (audioChunksRef.current.length > 0) {
          console.log(
            `Sending ${audioChunksRef.current.length} audio chunks to backend`
          );
          sendAudioToBackend();
        }
      }, 10000);
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      // Stop the media recorder and clear the interval.
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) =>
        track.stop()
      );
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      if (audioChunksRef.current.length > 0) {
        console.log(`Sending final ${audioChunksRef.current.length} chunks`);
        sendAudioToBackend();
      }
      setIsRecording(false);

      // Immediately show processing overlay.
      setIsProcessing(true);

      // Fetch the summary after a delay.
      setTimeout(() => {
        axios.get(`${SERVER_URL}/generate_summary`, {
            params: {
              ai_response: ai_response,
              transcript: transcript,
              user_id: localStorage.getItem("user_id"),
              meeting_id: localStorage.getItem("meeting_id"),
              admin_id: localStorage.getItem("admin_id"),
              FirstName: localStorage.getItem("FirstName"),
              LastName: localStorage.getItem("LastName"),
              Email: localStorage.getItem("email"),
              phoneNumber: localStorage.getItem("phoneNumber"),
              campaign: localStorage.getItem("campaign"),
              meetingType: localStorage.getItem("meetingType")
            },
          })
          .then((response) => {
            if (response.data.summary) {
              console.log("Summary:", response.data.summary);
              console.log("HELLO");
              setSummary(response.data.summary);
              setIsProcessing(false);
              // Redirect to the DetailSelect page.
              history.push("/DetailSelect");
            } else {
              console.log("HELLO");
              console.error("Error generating summary:", response.data.error);
              setIsProcessing(false);
            }
          })
          .catch((error) => {
            console.log("HELLO");
            console.error("Error calling summary endpoint:", error);
            setIsProcessing(false);
          });
          setTimeout(()=>{
            history.push("/DetailSelect");
          },15000)
      }, 4000);
    }
  };

  const sendAudioToBackend = async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("No audio chunks to send");
      return;
    }
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      console.log(`Created blob of size: ${audioBlob.size} bytes`);

      const formData = new FormData();
      formData.append("audio", audioBlob, "conversation.webm");
      formData.append("meetingType", localStorage.getItem("meetingType"));


      const response = await axios.post(`${SERVER_URL}/transcribe`, formData);
      if (response.data.transcript) {
        setTranscript(response.data.transcript);
        console.log("Transcription received:", response.data.transcript);
      }
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
  };

  const handleClickRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsVisibleAssistant(true);
  };

  return (
    <div className="list-page-inner">
      {/* Professional Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-container">
            <div className="spinner"></div>
            <p>Processing your recording. Please wait...</p>
          </div>
        </div>
      )}

      <div className="top-back-area">
        <div className="auto-container">
          <div className="row">
            <div className="col-12">
              <div
                className="back-btn-area style-two"
                onClick={() => setIsVisibleAssistant(false)}
              >
                <button className="btn-style-new">
                  <svg
                    width="24"
                    height="25"
                    viewBox="0 0 24 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.57895 7.5V12.5L0 6.25L7.57895 0V5H13.8947C16.5748 5 19.1451 6.05357 21.0402 7.92893C22.9353 9.8043 24 12.3478 24 15C24 17.6522 22.9353 20.1957 21.0402 22.0711C19.1451 23.9464 16.5748 25 13.8947 25H2.52632V22.5H13.8947C15.9048 22.5 17.8325 21.7098 19.2539 20.3033C20.6752 18.8968 21.4737 16.9891 21.4737 15C21.4737 13.0109 20.6752 11.1032 19.2539 9.6967C17.8325 8.29018 15.9048 7.5 13.8947 7.5H7.57895Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Information Section */}
      <div className="information-sec">
        <div className="auto-container">
          <div className="row">
            <div className="col-12">
              <div className="voice-area">
                <h1>AI Meeting Assistant</h1>
                <p>Speak naturally and get real-time AI meeting responses</p>
                {isRecording ? (
                  <button
                    className="speek-btn style-animation"
                    onClick={handleClickRecording}
                  >
                    <img
                      src={require("../../static/images/speek-btn.png")}
                      alt="Speak Button"
                    />
                  </button>
                ) : (
                  <button
                    className="speek-btn"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <img
                      src={require("../../static/images/speek-btn.png")}
                      alt="Speak Button"
                    />
                  </button>
                )}
              </div>

              <div className="information-box response-box">
                <h3>AI Response</h3>
                <div className="summery-box">
                  <pre style={responseStyle}>
                    {ai_response || "Waiting for AI Response...."}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Talk;
