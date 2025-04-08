
import axios from "axios";
import io from "socket.io-client";
import { saveAs } from "file-saver";
import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import "react-table-6/react-table.css";
import "./index.css";
import { URL } from "../../store/config";

const SERVER_URL = URL;
// const SERVER_URL = 'http://127.0.0.1:5000';

function formatAIResponse(text) {
  const lines = text.split('?').map(line => line.trim()).filter(Boolean);
  return lines.map(line => `${line}?`).join('\n');
}

const Talk = ({ setIsVisibleAssistant }) => {
  const history = useHistory();
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState("Waiting for transcription...");
  const [ai_response, setAIResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationTurns, setConversationTurns] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalIdRef = useRef(null);
  const socketRef = useRef(null);
  const fullTranscriptRef = useRef("");
  const lastMessageRef = useRef("");

  useEffect(() => {
    const socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    // socket.on("update", (data) => {
    //   // When transcript is received, only extract the new one
    //   // if (data.transcript) {
    //   //   const newFullTranscript = data.transcript.trim();
    //   //   let newPortion = newFullTranscript;
    //   //   if (newFullTranscript.startsWith(fullTranscriptRef.current)) {
    //   //     newPortion = newFullTranscript.substring(fullTranscriptRef.current.length).trim();
    //   //   }
    //   //   fullTranscriptRef.current = newFullTranscript;
    //   //   // If we have a new portion, update the UI
    //   //   if (newPortion) {
    //   //     setTranscript(newPortion);
    //   //     setConversationTurns((prevTurns) => [
    //   //       ...prevTurns,
    //   //       { user: newPortion, ai: "" }
    //   //     ]);
    //   //   }
    //   // }

    //   // Update transcript handling in the socket.on("update") callback:
    //   if (data.transcript) {
    //     const newFullTranscript = data.transcript.trim();
    //     let newPortion = newFullTranscript;
        
    //     if (newFullTranscript.startsWith(fullTranscriptRef.current)) {
    //       newPortion = newFullTranscript.substring(fullTranscriptRef.current.length).trim();
    //     }
        
    //     fullTranscriptRef.current = newFullTranscript;

    //     if (newPortion) {
    //       setTranscript(newPortion);
          
    //       setConversationTurns((prevTurns) => {
    //         // If last turn has no AI response, append to user's message
    //         if (prevTurns.length > 0 && prevTurns[prevTurns.length - 1].ai === "") {
    //           const updatedTurns = [...prevTurns];
    //           updatedTurns[updatedTurns.length - 1] = {
    //             ...updatedTurns[updatedTurns.length - 1],
    //             user: updatedTurns[updatedTurns.length - 1].user + " " + newPortion
    //           };
    //           return updatedTurns;
    //         }
    //         // Otherwise create new turn
    //         return [...prevTurns, { user: newPortion, ai: "" }];
    //       });
    //     }
    //   }
    //   // Process AI response
    //   if (data.ai_response) {
    //     const newAIMessage = data.ai_response.trim();
    //     if (lastMessageRef.current !== newAIMessage) {
    //       lastMessageRef.current = newAIMessage;
    //       setAIResponse((prev) =>
    //         prev ? prev + "\n" + data.ai_response : data.ai_response
    //       );
    //       setConversationTurns((prevTurns) => {
    //         if (prevTurns.length === 0) {
    //           return [{ user: "", ai: newAIMessage }];
    //         }
    //         const updatedTurns = [...prevTurns];
    //         updatedTurns[updatedTurns.length - 1] = {
    //           ...updatedTurns[updatedTurns.length - 1],
    //           ai: newAIMessage
    //         };
    //         return updatedTurns;
    //       });
    //     }
    //   }
    // });
    
    //checking
    socket.on("update", (data) => {
      if (data.transcript) {
        const newFullTranscript = data.transcript.trim();
        let newPortion = newFullTranscript;
    
        // Only keep new portion of transcript
        if (newFullTranscript.startsWith(fullTranscriptRef.current)) {
          newPortion = newFullTranscript.substring(fullTranscriptRef.current.length).trim();
        }
        
        fullTranscriptRef.current = newFullTranscript;
    
        if (newPortion) {
          setConversationTurns(prev => {
            // If last turn has no AI response, merge with previous user input
            if (prev.length > 0 && !prev[prev.length - 1].ai) {
              const updated = [...prev];
              updated[updated.length - 1].user += " " + newPortion;
              return updated;
            }
            // Otherwise create new user turn
            return [...prev, { user: newPortion, ai: "" }];
          });
        }
      }
    
      if (data.ai_response) {
        const newAIMessage = data.ai_response.trim();
        if (lastMessageRef.current !== newAIMessage) {
          lastMessageRef.current = newAIMessage;
          setConversationTurns(prev => {
            // Add AI response to last user turn
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].ai = newAIMessage;
            }
            return updated;
          });
        }
      }
    });

    // After processing AI response
    setConversationTurns(prev => {
      return prev.filter(turn => turn.user.trim() !== "" || turn.ai.trim() !== "");
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

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
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
      setIsProcessing(true);

      setTimeout(() => {
        axios.get(`${SERVER_URL}/generate_summary`, {
          params: {
            ai_response: ai_response,
            transcript: fullTranscriptRef.current,
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
              setSummary(response.data.summary);
              setIsProcessing(false);
              history.push("/DetailSelect");
            } else {
              console.error("Error generating summary:", response.data.error);
              setIsProcessing(false);
            }
          })
          .catch((error) => {
            console.error("Error calling summary endpoint:", error);
            setIsProcessing(false);
          });
        setTimeout(() => {
          history.push("/DetailSelect");
        }, 15000);
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

      const response = await axios.post(`${SERVER_URL}/transcribe`, formData, { timeout: 1200000 });

      if (response.data.transcript) {
        // Optionally, you can handle the transcript here as well.
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
    }
    setIsVisibleAssistant(true);
  };

  useEffect(() => {
    const startRecording = async () => {
      try {
        setIsProcessing(false);
        setIsRecording(true);
        setAIResponse("");
        // Reset transcript and full transcript storage on new recording
        setTranscript("Waiting for transcription...");
        fullTranscriptRef.current = "";
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
    startRecording();
    setIsVisibleAssistant(true);
  }, []);

  return (
    <div className="list-page-inner">
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-container">
            <div className="spinner"></div>
            <p>Processing your recording. Please wait...</p>
          </div>
        </div>
      )}

      <div className="top-back-area"></div>

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
                  <button className="speek-btn" onClick={handleClickRecording}>
                    <img
                      src={require("../../static/images/speek-btn.png")}
                      alt="Speak Button"
                    />
                  </button>
                )}
              </div>

              {/* Chat-like UI */}
              <div className="information-box response-box">
                <h3>Conversation</h3>
                <div className="summery-box">
                  {conversationTurns.map((turn, index) => (
                    <div key={index} className="chat-turn">
                      {turn.user && (
                        <div className="chat-bubble user">
                          <p><strong>User:</strong> {turn.user}</p>
                        </div>
                      )}
                      {turn.ai && (
                        <div className="chat-bubble ai">
                          <p>
                            <strong>AI Agent:</strong>
                            <pre
                              style={{
                                ...responseStyle,
                                margin: 0
                              }}
                            >
                              {formatAIResponse(turn.ai)}
                            </pre>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
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
