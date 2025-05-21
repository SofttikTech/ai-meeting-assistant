// import axios from "axios";
// import io from "socket.io-client";
// import { saveAs } from "file-saver";
// import React, { useState, useEffect, useRef } from "react";
// import { useHistory } from "react-router-dom";
// import "react-table-6/react-table.css";
// import "./index.css";
// import { URL } from "../../store/config";

// const SERVER_URL = URL;
// // const SERVER_URL = 'http://127.0.0.1:5000';

// function formatAIResponse(text) {
//   const lines = text.split('?').map(line => line.trim()).filter(Boolean);
//   return lines.map(line => `${line}?`).join('\n');
// }

// const Talk = ({ setIsVisibleAssistant }) => {
//   const history = useHistory();
//   const [summary, setSummary] = useState('');
//   const [transcript, setTranscript] = useState("Waiting for transcription...");
//   const [ai_response, setAIResponse] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [conversationTurns, setConversationTurns] = useState([]);

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const intervalIdRef = useRef(null);
//   const socketRef = useRef(null);
//   const fullTranscriptRef = useRef("");
//   const lastMessageRef = useRef("");
//   const [index, setIndex] = useState(0);
//   const [user, setUser] = useState("");
//   const [ai, setAI] = useState("");
//   const [messages, setMessages] = useState([]);
//   const messagesRef = useRef([]);


//   // time getting 

//   function formatTime(date) {
//     return date.toLocaleTimeString("en-GB", {
//       hour12: false,
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit"
//     });
//   }  useEffect(() => {
//     const socket = io(SERVER_URL);
//     socket.on("connect", () => {
//       console.log("Connected to server");
//     });

//     // Initialize messages with a system message
//     const initialMessage = {
//       role: "system",
//       content: "What made you book this meeting today?"
//     };
//     setMessages([initialMessage]);
//     messagesRef.current = [initialMessage];

//     // Add initial AI question to conversation turns
//     setConversationTurns([{
//       user: "",
//       ai: {
//         type: "question",
//         question: "What made you book this meeting today?"
//       }
//     }]);

//     socket.on("update", (data) => {
//       if (data.transcript) {
//         fullTranscriptRef.current += (fullTranscriptRef.current ? " " : "") + data.transcript;
//         setConversationTurns(prev => [
//           // push a new user turn; leave AI blank for now
//           ...prev,
//           { user: data.transcript, ai: "" }
//         ]);
        
//       }

//       if (data['ai_response']) {
//         const newAIMessage = data["ai_response"];
//         if (lastMessageRef.current !== newAIMessage) {
//           lastMessageRef.current = newAIMessage;
//           setConversationTurns(prev => {
//             // Add AI response to last user turn
//             const updated = [...prev];
//             if (updated.length > 0) {
//               updated[updated.length - 1].ai = newAIMessage;
//             }
//             return updated;
//           });

//           const text = newAIMessage.type === "question"
//             ? newAIMessage.question
//             : newAIMessage.type === "pain_point"
//               ? newAIMessage.pain_point
//               : newAIMessage.type === "recommendation"
//                 ? newAIMessage.recommendation
//                 : JSON.stringify(newAIMessage);

//           // 2) append
//           setAIResponse(prev => prev
//             ? `${prev}\n\n${text}`
//             : text
//           );

//         }
//       }
//       if (data["messages"]) {
//         console.log("IN socket: ", data["messages"]);
//         setMessages(prev => {
//           const updated = data["messages"];
//           messagesRef.current = updated;
//           return updated;
//         });
//       }
//     });

//     // After processing AI response
//     setConversationTurns(prev => {
//       return prev.filter(turn => {
//         const hasUserContent = turn.user && turn.user.trim() !== "";
//         const hasAIContent = turn.ai && (
//           (turn.ai.type === "question" && turn.ai.question) ||
//           (turn.ai.type === "pain_point" && turn.ai.pain_point) ||
//           (turn.ai.type === "recommendation" && turn.ai.recommendation)
//         );
//         return hasUserContent || hasAIContent;
//       });
//     });

//     socket.on("status", (data) => {
//       console.log("Server status:", data.message);
//     });
//     socketRef.current = socket;
//     return () => {
//       socket.disconnect();
//     };
//   }, []);


//   const startTimeRef = useRef(null);
//   const startTimeStrRef = useRef(null);
//   startTimeRef.current = new Date();
//   startTimeStrRef.current = formatTime(startTimeRef.current);
//   const start_time = startTimeStrRef.current;



//   // Cleanup on unmount.
//   useEffect(() => {
//     return () => {
//       if (intervalIdRef.current) clearInterval(intervalIdRef.current);
//       if (
//         mediaRecorderRef.current &&
//         mediaRecorderRef.current.state === "recording"
//       ) {
//         mediaRecorderRef.current.stop();
//       }
//     };
//   }, []);

//   useEffect(() => {
//     console.log("messages state now is:", messages);
//   }, [messages]);

//   const stopRecording = () => {
//     if (
//       mediaRecorderRef.current &&
//       mediaRecorderRef.current.state === "recording"
//     ) {
//       mediaRecorderRef.current.stop();
//       mediaRecorderRef.current.stream.getTracks().forEach((track) =>
//         track.stop()
//       );
//       if (intervalIdRef.current) {
//         clearInterval(intervalIdRef.current);
//         intervalIdRef.current = null;
//       }
//       if (audioChunksRef.current.length > 0) {
//         console.log(`Sending final ${audioChunksRef.current.length} chunks`);
//         sendAudioToBackend();
//       }
//       setIsRecording(false);
//       setIsProcessing(true);

//       setTimeout(() => {
//         axios.get(`${SERVER_URL}/generate_summary`, {
//           params: {
//             ai_response: ai_response,
//             transcript: fullTranscriptRef.current,
//             user_id: localStorage.getItem("user_id"),
//             meeting_id: localStorage.getItem("meeting_id"),
//             admin_id: localStorage.getItem("admin_id"),
//             FirstName: localStorage.getItem("FirstName"),
//             LastName: localStorage.getItem("LastName"),
//             Email: localStorage.getItem("email"),
//             phoneNumber: localStorage.getItem("phoneNumber"),
//             campaign: localStorage.getItem("campaign"),
//             meetingType: localStorage.getItem("meetingType"),
//             history: JSON.stringify(messagesRef.current)
//           },
//         })
//           .then((response) => {
//             if (response.data.summary) {
//               console.log("Summary:", response.data.summary);
//               setSummary(response.data.summary);
//               setIsProcessing(false);
//               history.push("/DetailSelect");
//             } else {
//               console.error("Error generating summary:", response.data.error);
//               setIsProcessing(false);
//             }
//           })
//           .catch((error) => {
//             console.error("Error calling summary endpoint:", error);
//             setIsProcessing(false);
//           });
//         setTimeout(() => {
//           history.push("/DetailSelect");
//         }, 18000);
//       }, 4000);
//     }
//   };

//   const sendAudioToBackend = async () => {

//     if (audioChunksRef.current.length === 0) {
//       console.log("No audio chunks to send");
//       return;
//     }
//     try {
//       const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//       console.log(`Created blob of size: ${audioBlob.size} bytes`);
//       // if(conversationTurns){

//       // }

//       const formData = new FormData();
//       formData.append("audio", audioBlob, "conversation.webm");
//       formData.append("meetingType", localStorage.getItem("meetingType"));
//       formData.append("startTime", start_time);
//       formData.append("currenTime", formatTime(new Date()));
//       formData.append("messages", JSON.stringify(messagesRef.current));
//       formData.append("email",localStorage.getItem("email"));

//       const response = await axios.post(`${SERVER_URL}/transcribe`, formData, { timeout: 1200000 });

//       if (response.data.transcript) {
//         // Optionally, you can handle the transcript here as well.
//         console.log("Transcription received:", response.data.transcript);
//       }
//       audioChunksRef.current = [];
//     } catch (error) {
//       console.error("Error sending audio:", error);
//     }
//   };

//   const responseStyle = {
//     whiteSpace: "pre-wrap",
//     wordWrap: "break-word",
//     overflowX: "hidden",
//     padding: "10px",
//   };

//   const handleClickRecording = () => {
//     if (isRecording) {
//       stopRecording();
//     }
//     setIsVisibleAssistant(true);
//   };

//   useEffect(() => {
//     const startRecording = async () => {
//       try {
//         setIsProcessing(false);
//         setIsRecording(true);
//         setAIResponse("");
//         // Reset transcript and full transcript storage on new recording
//         setTranscript("Waiting for transcription...");
//         fullTranscriptRef.current = "";
//         audioChunksRef.current = [];

//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         mediaRecorderRef.current = new MediaRecorder(stream, {
//           mimeType: "audio/webm",
//         });
//         mediaRecorderRef.current.ondataavailable = (event) => {
//           if (event.data.size > 0) {
//             console.log(`Received chunk: ${event.data.size} bytes`);
//             audioChunksRef.current.push(event.data);
//           }
//         };
//         mediaRecorderRef.current.start(1000);
//         console.log("Recording started");

//         intervalIdRef.current = setInterval(() => {
//           if (audioChunksRef.current.length > 0) {
//             console.log(
//               `Sending ${audioChunksRef.current.length} audio chunks to backend`
//             );
//             sendAudioToBackend();
//           }
//         }, 15000);
//       } catch (error) {
//         console.error("Error starting recording:", error);
//         setIsRecording(false);
//       }
//     };
//     startRecording();
//     setIsVisibleAssistant(true);
//   }, []);

//   return (
//     <div className="list-page-inner">
//       {isProcessing && (
//         <div className="processing-overlay">
//           <div className="processing-container">
//             <div className="spinner"></div>
//             <p>Processing your recording. Please wait...</p>
//           </div>
//         </div>
//       )}

//       <div className="top-back-area"></div>

//       {/* Main Information Section */}
//       <div className="information-sec">
//         <div className="auto-container">
//           <div className="row">
//             <div className="col-12">
//               <div className="voice-area">
//                 <h1>AI Meeting Assistant</h1>
//                 <p>Speak naturally and get real-time AI meeting responses</p>
//                 {isRecording ? (
//                   <button
//                     className="speek-btn style-animation"
//                     onClick={handleClickRecording}
//                   >
//                     <img
//                       src={require("../../static/images/speek-btn.png")}
//                       alt="Speak Button"
//                     />
//                   </button>
//                 ) : (
//                   <button className="speek-btn" onClick={handleClickRecording}>
//                     <img
//                       src={require("../../static/images/speek-btn.png")}
//                       alt="Speak Button"
//                     />
//                   </button>
//                 )}
//               </div>

//               {/* Chat-like UI */}
//               <div className="information-box response-box">
//                 <h3>Conversation</h3>
//                 <div className="summery-box">
//                   {conversationTurns.map((turn, index) => (
//                     <div key={index} className="chat-turn">
//                       {turn.user && (
//                         <div className="chat-bubble user">
//                           <div className="chat-ai-box">
//                             <p>{turn.user}</p>
//                             <i className="icon">
//                               <img
//                                 src={require("../../static/images/avatar-face.png")}
//                                 alt="Speak Button"
//                               />
//                             </i>
//                           </div>
//                         </div>
//                       )}

//                       {turn.ai && (
//                         <div className="chat-bubble ai">
//                           {/* Question */}
//                           {turn.ai.type === "question" && (
//                             <div className="chat-ai-box">
//                               <span className="tooltip-top-ai question">Question</span>
//                               <i className="icon">
//                                 <img
//                                   src={require("../../static/images/ai-assitant-img.png")}
//                                   alt="Speak Button"
//                                 />
//                               </i>
//                               <p>
//                                 {" "}{turn.ai.question}
//                               </p>
//                             </div>

//                           )}

//                           {/* Pain-Point */}
//                           {turn.ai.type === "pain_point" && (
//                             <div className="chat-ai-box">
//                               <span className="tooltip-top-ai pain-point">Pain Point</span>
//                               <i className="icon">
//                                 <img
//                                   src={require("../../static/images/ai-assitant-img.png")}
//                                   alt="Speak Button"
//                                 />
//                               </i>
//                               <p>
//                                 {" "}{turn.ai.pain_point}
//                                 <br/>
//                                 {turn.ai.follow_up[0]}
//                                 <br/>
//                                 {turn.ai.follow_up[1]}
//                                 <br/>
//                                 {turn.ai.follow_up[2]}
//                               </p>
//                             </div>
//                           )}

//                           {/* Recommendation */}
//                           {turn.ai.type === "recommendation" && (
//                             <div className="chat-ai-box">
//                               <span className="tooltip-top-ai recommendation">Recommendation</span>
//                               <i className="icon">
//                                 <img
//                                   src={require("../../static/images/ai-assitant-img.png")}
//                                   alt="Speak Button"
//                                 />
//                               </i>
//                               <p>
//                                 {" "}{turn.ai.recommendation}
//                                 <br/>
//                                 {turn.ai.follow_up[0]}
//                                 <br/>
//                                 {turn.ai.follow_up[1]}
//                                 <br/>
//                                 {turn.ai.follow_up[2]}
//                               </p>
//                             </div>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Talk;

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
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const socketRef = useRef(null);
  const fullTranscriptRef = useRef("");
  const lastMessageRef = useRef("");
  const [index, setIndex] = useState(0);
  const [user, setUser] = useState("");
  const [ai, setAI] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);

  const SILENCE_THRESHOLD = -45;
  const SILENCE_DURATION = 2000;
  const SAMPLE_RATE = 44100;
  const hasStartedSpeakingRef = useRef(false);
  const silenceStartTimeRef = useRef(null);
  const lastAudioLevelRef = useRef(0);
  const consecutiveSilenceCountRef = useRef(0);
  const MIN_SILENCE_SAMPLES = 3;
  const MIN_AUDIO_LEVEL = 0.005;
  const BACKGROUND_NOISE_THRESHOLD = 0.001;
  const isInitialSilenceRef = useRef(true);

  function formatTime(date) {
    return date.toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }  useEffect(() => {
    const socket = io(SERVER_URL);
    socket.on("connect", () => {
      console.log("Connected to server");
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
      if (data.transcript) {
        fullTranscriptRef.current += (fullTranscriptRef.current ? " " : "") + data.transcript;
        setConversationTurns(prev => [
          // push a new user turn; leave AI blank for now
          ...prev,
          { user: data.transcript, ai: "" }
        ]);
        
      }

      if (data['ai_response']) {
        const newAIMessage = data["ai_response"];
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

          const text = newAIMessage.type === "question"
            ? newAIMessage.question
            : newAIMessage.type === "pain_point"
              ? newAIMessage.pain_point
              : newAIMessage.type === "recommendation"
                ? newAIMessage.recommendation
                : JSON.stringify(newAIMessage);

          // 2) append
          setAIResponse(prev => prev
            ? `${prev}\n\n${text}`
            : text
          );

        }
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
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
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

  const startSilenceDetection = (stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.2;
      
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkSilence = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        let maxValue = 0;
        let speechBandSum = 0;
        
        // Calculate overall audio level and speech band energy
        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          sum += value * value;
          maxValue = Math.max(maxValue, value);
          
          // Focus on speech frequencies (85-255 Hz)
          const frequency = i * SAMPLE_RATE / (2 * bufferLength);
          if (frequency >= 85 && frequency <= 255) {
            speechBandSum += value * value;
          }
        }
        
        const rms = Math.sqrt(sum / bufferLength);
        const db = 20 * Math.log10(rms / 255);
        const normalizedMax = maxValue / 255;
        const speechEnergy = Math.sqrt(speechBandSum / bufferLength) / 255;
        
        lastAudioLevelRef.current = db;
        
        // Check if we're in initial silence
        if (isInitialSilenceRef.current) {
          if (speechEnergy > BACKGROUND_NOISE_THRESHOLD) {
            isInitialSilenceRef.current = false;
            console.log('Initial silence ended');
          }
          requestAnimationFrame(checkSilence);
          return;
        }
        
        // Speech detection
        if (speechEnergy > MIN_AUDIO_LEVEL) {
          if (!hasStartedSpeakingRef.current) {
            hasStartedSpeakingRef.current = true;
            console.log('Speech detected');
          }
          
          isSpeakingRef.current = true;
          silenceStartTimeRef.current = null;
          consecutiveSilenceCountRef.current = 0;
          
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else if (isSpeakingRef.current && hasStartedSpeakingRef.current) {
          consecutiveSilenceCountRef.current++;
          
          if (consecutiveSilenceCountRef.current >= MIN_SILENCE_SAMPLES) {
            const now = Date.now();
            
            if (!silenceStartTimeRef.current) {
              silenceStartTimeRef.current = now;
              console.log('Silence started');
            }
            
            const silenceDuration = now - silenceStartTimeRef.current;
            
            if (silenceDuration >= SILENCE_DURATION && !silenceTimeoutRef.current) {
              console.log('2 seconds of silence detected, sending audio');
              if (audioChunksRef.current.length > 0) {
                sendAudioToBackend();
              }
              silenceStartTimeRef.current = null;
              isSpeakingRef.current = false;
              consecutiveSilenceCountRef.current = 0;
            }
          }
        }
        
        requestAnimationFrame(checkSilence);
      };
      
      checkSilence();
    } catch (error) {
      console.error('Error starting silence detection:', error);
    }
  };

  const stopSilenceDetection = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    hasStartedSpeakingRef.current = false;
    silenceStartTimeRef.current = null;
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      stopSilenceDetection();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) =>
        track.stop()
      );
      
      if (hasStartedSpeakingRef.current && audioChunksRef.current.length > 0) {
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

  const sendAudioToBackend = async () => {

    if (audioChunksRef.current.length === 0) {
      console.log("No audio chunks to send");
      return;
    }
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      console.log(`Created blob of size: ${audioBlob.size} bytes`);
      // if(conversationTurns){

      // }

      const formData = new FormData();
      formData.append("audio", audioBlob, "conversation.webm");
      formData.append("meetingType", localStorage.getItem("meetingType"));
      formData.append("startTime", start_time);
      formData.append("currenTime", formatTime(new Date()));
      formData.append("messages", JSON.stringify(messagesRef.current));
      formData.append("email",localStorage.getItem("email"));

      const response = await axios.post(`${SERVER_URL}/transcribe`, formData, { timeout: 1200000 });

      if (response.data.transcript) {
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
        setTranscript("Waiting for transcription...");
        fullTranscriptRef.current = "";
        audioChunksRef.current = [];
        hasStartedSpeakingRef.current = false;
        silenceStartTimeRef.current = null;
        isInitialSilenceRef.current = true;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1
          } 
        });
        
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        startSilenceDetection(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.start(1000);
        console.log("Recording started");

      } catch (error) {
        console.error("Error starting recording:", error);
        setIsRecording(false);
      }
    };
    startRecording();
    setIsVisibleAssistant(true);

    return () => {
      stopSilenceDetection();
    };
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
                <div className="button-container" style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {isRecording ? (
                    <button
                      className="speek-btn style-animation"
                    >
                      <img
                        src={require("../../static/images/speek-btn.png")}
                        alt="Speak Button"
                      />
                    </button>
                  ) : (
                    <button className="speek-btn">
                      <img
                        src={require("../../static/images/speek-btn.png")}
                        alt="Speak Button"
                      />
                    </button>
                  )}
                  <button 
                    className="close-btn" 
                    onClick={handleClickRecording}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#f5f5f5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                      marginLeft: '10px'
                    }}
                  >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat-like UI */}
              <div className="information-box response-box">
                <h3>Conversation</h3>
                <div className="summery-box" style={{
                  height: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px'
                }}>
                  {conversationTurns.map((turn, index) => (
                    <div key={index} className="chat-turn" style={{
                      marginBottom: '20px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {turn.user && (
                        <div className="chat-bubble user" style={{
                          alignSelf: 'flex-end',
                          maxWidth: '80%'
                        }}>
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

                      {turn.ai && (
                        <div className="chat-bubble ai" style={{
                          alignSelf: 'flex-start',
                          maxWidth: '80%'
                        }}>
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
                              </p>
                            </div>
                          )}
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