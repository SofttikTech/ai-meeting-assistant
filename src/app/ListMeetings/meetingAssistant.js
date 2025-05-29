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

// Add server URL validation
const validateServerUrl = async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/transcribe`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error("Server URL validation failed:", error);
    return false;
  }
};

const Talk = ({ setIsVisibleAssistant }) => {
  const history = useHistory();
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState("Waiting for transcription...");
  const [ai_response, setAIResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationTurns, setConversationTurns] = useState([]);
  const [isAutoRecording, setIsAutoRecording] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const lastQuestionRef = useRef("");
  const pendingAudioChunksRef = useRef([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const intervalIdRef = useRef(null);
  const recordingCycleIdRef = useRef(null);
  const socketRef = useRef(null);
  const fullTranscriptRef = useRef("");
  const lastMessageRef = useRef("");
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState("");
  const [ai, setAI] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);

  // Add these refs at the top of your component
  const lastDisplayedTranscriptRef = useRef("");
  const lastDisplayedAIResponseRef = useRef("");
  const pendingTranscriptRef = useRef(null);
  const pendingAIResponseRef = useRef(null);

  // --- Add these refs for audio/silence detection ---
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const volumeCheckIntervalRef = useRef(null);
  const silenceStartRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const waitingForSpeechRef = useRef(false);
  const hasSpokenSinceLastSendRef = useRef(false);
  // --- End audio/silence detection refs ---

  function formatTime(date) {
    return date.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function formatTimeAI(date) {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Add debounce function for questions
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Modify the socket event handler to prevent duplicate questions
  useEffect(() => {
    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
      query: {
        clientId: localStorage.getItem("user_id")
      }
    });

    socket.on("connect", () => {
      console.log("Connected to server at:", SERVER_URL);
      setIsNetworkError(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error (handled silently):", error);
      setIsNetworkError(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected (handled silently):", reason);
      setIsNetworkError(true);
    });

    // Initialize messages with a system message
    const initialMessage = {
      role: "system",
      content: "What made you book this meeting today?"
    };
    setMessages([initialMessage]);
    messagesRef.current = [initialMessage];

    // Add initial AI question to conversation turns
    setConversationTurns([{
      user: "",
      ai: {
        type: "question",
        question: "What made you book this meeting today?"
      }
    }]);

    socket.on("update", (data) => {
      // Buffer transcript
      if (data.transcript) {
        const newTranscript = data.transcript.trim();
        if (newTranscript && newTranscript !== lastDisplayedTranscriptRef.current) {
          pendingTranscriptRef.current = newTranscript;
          // Accumulate the full transcript
          if (fullTranscriptRef.current) {
            fullTranscriptRef.current += " " + newTranscript;
          } else {
            fullTranscriptRef.current = newTranscript;
          }
        }
      }

      // Buffer AI response
      if (data['ai_response']) {
        const newAIMessage = data["ai_response"];
        const newAIText = (newAIMessage.question || newAIMessage.pain_point || newAIMessage.recommendation || "").trim();
        if (newAIText && newAIText !== lastDisplayedAIResponseRef.current) {
          pendingAIResponseRef.current = newAIMessage;
        }
      }

      // Only add to conversationTurns when both transcript and AI response are present
      if (pendingTranscriptRef.current && pendingAIResponseRef.current) {
        const aiTime = formatTimeAI(new Date());
        setConversationTurns(prev => [
          ...prev,
          { user: pendingTranscriptRef.current, ai: pendingAIResponseRef.current, aiTime }
        ]);
        lastDisplayedTranscriptRef.current = pendingTranscriptRef.current;
        lastDisplayedAIResponseRef.current = (pendingAIResponseRef.current.question || pendingAIResponseRef.current.pain_point || pendingAIResponseRef.current.recommendation || "").trim();
        pendingTranscriptRef.current = null;
        pendingAIResponseRef.current = null;
      }

      if (data["messages"]) {
        console.log("IN socket: ", data["messages"]);
        setMessages(prev => {
          const updated = data["messages"];
          messagesRef.current = updated;
          return updated;
        });
      }
    });

    // After processing AI response
    setConversationTurns(prev => {
      return prev.filter(turn => {
        const hasUserContent = turn.user && turn.user.trim() !== "";
        const hasAIContent = turn.ai && (
          (turn.ai.type === "question" && turn.ai.question) ||
          (turn.ai.type === "pain_point" && turn.ai.pain_point) ||
          (turn.ai.type === "recommendation" && turn.ai.recommendation)
        );
        return hasUserContent || hasAIContent;
      });
    });

    socket.on("status", (data) => {
      console.log("Server status:", data.message);
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  const startTimeRef = useRef(null);
  const startTimeStrRef = useRef(null);
  startTimeRef.current = new Date();
  startTimeStrRef.current = formatTime(startTimeRef.current);
  const start_time = startTimeStrRef.current;

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

  useEffect(() => {
    console.log("messages state now is:", messages);
  }, [messages]);

  

  // useEffect(() => {
  //   if (conversationTurns.length === 0) return;
  //   const last = conversationTurns[conversationTurns.length - 1];
  //   setUser(last.user);
  //   // pick the right field from last.ai:
  //   const text =
  //     last.ai.question     ||
  //     last.ai.pain_point   ||
  //     last.ai.recommendation ||
  //     "";
  //   setAI(text);

  //   messages.push({"role":"user","content":user});
  //   messages.push({"role":"assistant","content":ai});

  // }, [conversationTurns]);

  // Function to handle network errors and retries
  const handleNetworkError = async (error, audioData) => {
    console.error("Network error occurred (handled silently):", error);
    setIsNetworkError(true);
    
    if (audioData) {
      pendingAudioChunksRef.current.push(audioData);
    }

    if (socketRef.current && !socketRef.current.connected) {
      try {
        await new Promise((resolve) => {
          socketRef.current.connect();
          socketRef.current.on('connect', resolve);
        });
        console.log("Socket reconnected successfully");
      } catch (socketError) {
        console.error("Socket reconnection failed (handled silently):", socketError);
      }
    }

    // Retry sending pending audio data
    if (pendingAudioChunksRef.current.length > 0) {
      try {
        const retryData = pendingAudioChunksRef.current.shift();
        await sendAudioToBackend(retryData);
        setRetryCount(0);
        setIsNetworkError(false);
      } catch (retryError) {
        console.error("Retry failed (handled silently):", retryError);
        setRetryCount(prev => prev + 1);
      }
    }
  };

  const stopAndRestartRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        const stopPromise = new Promise((resolve) => {
          mediaRecorderRef.current.onstop = () => {
            console.log("Previous recording stopped");
            resolve();
          };
          mediaRecorderRef.current.stop();
        });

        await stopPromise;
        
        // Stop all tracks
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          const audioData = [...audioChunksRef.current];
          try {
            await sendAudioToBackend(audioData);
            setRetryCount(0);
            setIsNetworkError(false);
          } catch (error) {
            await handleNetworkError(error, audioData);
          }
        }
        
        audioChunksRef.current = [];

        await new Promise(resolve => setTimeout(resolve, 500));

        const newStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            sampleSize: 16,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        const mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error('MIME type not supported: ' + mimeType);
        }
          
        const newMediaRecorder = new MediaRecorder(newStream, {
          mimeType: mimeType,
          audioBitsPerSecond: 16000
        });
        
        newMediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log(`Received chunk: ${event.data.size} bytes`);
            audioChunksRef.current.push(event.data);
          }
        };

        // Start new recording
        newMediaRecorder.start(1000);
        console.log("New recording started with mimeType:", mimeType);
        
        mediaRecorderRef.current = newMediaRecorder;
        
        if (conversationTurns.length > 0) {
          const lastTurn = conversationTurns[conversationTurns.length - 1];
          if (lastTurn.user) lastDisplayedTranscriptRef.current = lastTurn.user.trim();
          if (lastTurn.ai) {
            lastDisplayedAIResponseRef.current = (lastTurn.ai.question || lastTurn.ai.pain_point || lastTurn.ai.recommendation || "").trim();
          }
        }
      } catch (error) {
        console.error("Error in recording cycle:", error);
        if (mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.start(1000);
          } catch (restartError) {
            console.error("Failed to restart recording:", restartError);
            setIsRecording(false);
          }
        }
      }
    }
  };

  
  const sendAudioToBackend = async (audioData = audioChunksRef.current) => {
    if (audioData.length === 0) {
      console.log("No audio chunks to send");
      return;
    }
    try {
      // Create a proper WebM container with all chunks
      const audioBlob = new Blob(audioData, { 
        type: 'audio/webm;codecs=opus'
      });
      console.log(`Created blob of size: ${audioBlob.size} bytes with type: ${audioBlob.type}`);

      const formData = new FormData();
      formData.append("audio", audioBlob, "conversation.webm");
      formData.append("meetingType", localStorage.getItem("meetingType"));
      formData.append("startTime", start_time);
      formData.append("currenTime", formatTime(new Date()));
      formData.append("messages", JSON.stringify(messagesRef.current));
      formData.append("email", localStorage.getItem("email"));

      // Add request configuration with silent error handling
      const config = {
        timeout: 1200000,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
        retry: 3,
        retryDelay: 1000,
        validateStatus: function (status) {
          return status >= 200 && status < 500;
        }
      };

      try {
        const response = await axios.post(`${SERVER_URL}/transcribe`, formData, config);
        if (response.data.transcript) {
          console.log("Transcription received:", response.data.transcript);
        }
      } catch (error) {
        console.error("Audio send error (handled silently):", error);
        if (error.response?.status !== 404) {
          pendingAudioChunksRef.current.push(audioData);
        }
      }
    } catch (error) {
      // Handle any other errors silently
      console.error("Audio processing error (handled silently):", error);
    }
  };

  const handleClickRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsVisibleAssistant(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
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

      // Wait for the final transcription to be processed
      setTimeout(() => {
        // Ensure we have a transcript before making the request
        if (!fullTranscriptRef.current) {
          console.error("No transcript available for summary generation");
          setIsProcessing(false);
          return;
        }

        axios.get(`${SERVER_URL}/generate_summary`, {
          params: {
            ai_response: ai_response,
            transcript: fullTranscriptRef.current,
            user_id: localStorage.getItem("user_id"),
            admin_id: localStorage.getItem("admin_id"),
            FirstName: localStorage.getItem("FirstName"),
            LastName: localStorage.getItem("LastName"),
            Email: localStorage.getItem("email"),
            phoneNumber: localStorage.getItem("phoneNumber"),
            campaign: localStorage.getItem("campaign"),
            meetingType: localStorage.getItem("meetingType"),
            history: JSON.stringify(messagesRef.current)
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
        }, 18000);
      }, 4000);
    }
  };

  const responseStyle = {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    overflowX: "hidden",
    padding: "10px",
  };

  // const handleClickRecording = () => {
  //   if (isRecording) {
  //     stopAndRestartRecording();
  //   }
  //   setIsVisibleAssistant(true);
  // };

  useEffect(() => {
    async function cleanupResources() {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        await new Promise(resolve => {
          mediaRecorderRef.current.onstop = resolve;
          mediaRecorderRef.current.stop();
        });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      audioContextRef.current = null;
      if (volumeCheckIntervalRef.current) {
        clearInterval(volumeCheckIntervalRef.current);
        volumeCheckIntervalRef.current = null;
      }
      analyserRef.current = null;
      sourceRef.current = null;
      silenceStartRef.current = null;
      shouldRestartRef.current = false;
      waitingForSpeechRef.current = false;
      setIsRecording(false);
    }

    async function startMediaRecorder() {
      await cleanupResources();
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined
        });
        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = async () => {
          try {
            if (audioChunksRef.current.length > 0) {
              const audioData = [...audioChunksRef.current];
              audioChunksRef.current = [];
              await sendAudioToBackend(audioData);
            }
          } catch (err) {
            // handle error
          } finally {
            if (shouldRestartRef.current) {
              shouldRestartRef.current = false;
              await startMediaRecorder();
            }
          }
        };
        mediaRecorderRef.current.start(500);
        setIsRecording(true);

        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        sourceRef.current.connect(analyserRef.current);

        if (volumeCheckIntervalRef.current) clearInterval(volumeCheckIntervalRef.current);
        volumeCheckIntervalRef.current = setInterval(() => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
          const data = new Uint8Array(analyserRef.current.fftSize);
          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const val = (data[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / data.length);
          //console.log('RMS:', rms);
          if (rms < 0.05) {
            if (!silenceStartRef.current) {
              silenceStartRef.current = Date.now();
              console.log('Silence started at:', silenceStartRef.current);
            }
            if (
              hasSpokenSinceLastSendRef.current &&
              !waitingForSpeechRef.current &&
              Date.now() - silenceStartRef.current > 4000
            ) {
              console.log('Silence detected after 4 seconds', Date.now() - silenceStartRef.current);
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                shouldRestartRef.current = true;
                waitingForSpeechRef.current = true;
                hasSpokenSinceLastSendRef.current = false; // Reset after sending
                mediaRecorderRef.current.stop();
              }
              silenceStartRef.current = null;
            }
          } else {
            silenceStartRef.current = null;
            waitingForSpeechRef.current = false;
            hasSpokenSinceLastSendRef.current = true; // Mark that user has spoken
          }
        }, 1000);
      } catch (err) {
        setIsRecording(false);
      }
    }

    setIsProcessing(false);
    setIsRecording(true);
    setAIResponse("");
    setTranscript("Waiting for transcription...");
    fullTranscriptRef.current = "";
    audioChunksRef.current = [];
    startMediaRecorder();
    setIsVisibleAssistant(true);

    return () => {
      cleanupResources();
    };
  }, []);

  // Add server status check
  useEffect(() => {
    const checkServerStatus = async () => {
      const isServerAvailable = await validateServerUrl();
      if (!isServerAvailable) {
        console.error("Server is not available at:", SERVER_URL);
        // You might want to show a user-friendly message here
      }
    };
    checkServerStatus();
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

                      {turn.ai && (
                        <div className="chat-bubble ai">
                          {/* Question */}
                          {turn.ai.type === "question" && (
                            <div className="chat-ai-box">
                              <span className="tooltip-top-ai question">Question</span>
                              <i className="icon">
                                <img
                                  src={require("../../static/images/ai-assitant-img.png")}
                                  alt="Speak Button"
                                />
                              </i>
                              <p>
                                {" "}{turn.ai.question}
                                {turn.aiTime && (
                                  <span>
                                    {turn.aiTime}
                                  </span>
                                )}
                              </p>
                            </div>

                          )}

                          {/* Pain-Point */}
                          {turn.ai.type === "pain_point" && (
                            <div className="chat-ai-box">
                              <span className="tooltip-top-ai pain-point">Pain Point</span>
                              <i className="icon">
                                <img
                                  src={require("../../static/images/ai-assitant-img.png")}
                                  alt="Speak Button"
                                />
                              </i>
                              <p>
                                {" "}{turn.ai.pain_point}
                                <br/>
                                {turn.ai.follow_up[0]}
                                <br/>
                                {turn.ai.follow_up[1]}
                                <br/>
                                {turn.ai.follow_up[2]}
                                {turn.aiTime && (
                                  <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 8 }}>
                                    {turn.aiTime}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Recommendation */}
                          {turn.ai.type === "recommendation" && (
                            <div className="chat-ai-box">
                              <span className="tooltip-top-ai recommendation">Recommendation</span>
                              <i className="icon">
                                <img
                                  src={require("../../static/images/ai-assitant-img.png")}
                                  alt="Speak Button"
                                />
                              </i>
                              <p>
                                {" "}{turn.ai.recommendation}
                                <br/>
                                {turn.ai.follow_up[0]}
                                <br/>
                                {turn.ai.follow_up[1]}
                                <br/>
                                {turn.ai.follow_up[2]}
                                {turn.aiTime && (
                                  <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 8 }}>
                                    {turn.aiTime}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {turn.user && (
                        <div className="chat-bubble user">
                          <div className="chat-ai-box">
                            <p>{turn.user}</p>
                            <i className="icon">
                              <img
                                src={require("../../static/images/avatar-face.png")}
                                alt="Speak Button"
                              />
                            </i>
                          </div>
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