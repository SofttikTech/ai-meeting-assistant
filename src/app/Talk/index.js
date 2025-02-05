import WOW from 'wowjs';
import { Link } from 'react-router-dom';
import React, { useState, useCallback,useEffect } from 'react';
import {
  LiveKitRoom,
  BarVisualizer,
  useVoiceAssistant,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
} from '@livekit/components-react';
import './index.css';
import '../../static/css/animate.css';
import CallingAnimation from "../Talk/callingAnimation";

const Talk = () => {

    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    const [connectionDetails, setConnectionDetails] = useState(null);
    const [agentState, setAgentState] = useState("disconnected");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [voiceState, setVoiceState] = useState('idle');

    const handleConnect = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
        const response = await fetch('http://localhost:5002/api/connection_details');
        if (!response.ok) {
            throw new Error('Failed to fetch connection details');
        }
        const data = await response.json();
        setConnectionDetails(data);
        console.log(data);
        } catch (error) {
        setError(error.message);
        console.error("Failed to fetch connection details:", error);
        } finally {
        setIsLoading(false);
        }
    }, []);

    const handleVoiceAgentStateChange = (newState) => {
        setVoiceState(newState);
    };

    const [progressWidth, setProgressWidth] = useState(0);

    // This will simulate the voice agent speaking, updating the width over time.
    useEffect(() => {
        if (voiceState === 'speaking') {
            let width = 0;
            const interval = setInterval(() => {
                width += 2;
                if (width >= 99) {
                    clearInterval(interval);
                }
                setProgressWidth(width);
            }, 100);

            return () => clearInterval(interval);
        }
        else{
            setProgressWidth(0);
        }
    }, [voiceState]);


    const handleDisconnect = () => setConnectionDetails(null);
    
    return (
        <div className="landing-screen">
            <Link to="/ContactDetail" className='back-btn'>
                <img src={require("../../static/images/back-arrow.png")} alt="" />
            </Link>
            <div className='talk-area'>
                <div className='left-area'>
                    <div className='image-box'>
                        <div className='arrow-left'>
                            <img src={require("../../static/images/left-speak-arrow.png")} alt="" />
                        </div>
                        <h4>Billy</h4>
                        <div className='shadow-area'>
                            <img src={require("../../static/images/talk-img.png")} alt="" />
                        </div>
                        <div className='arrow-right'>
                            <img src={require("../../static/images/right-speak-arrow.png")} alt="" />
                        </div>
                    </div>
                    <div className='layers-area'>
                        {/* <img src={require("../../static/images/layers.png")} alt="" /> */}
                        <div class="progress-bar-container">
                            <div class="progress-bar">
                                <span class="percentage c" style={{width: `${progressWidth}%`}}></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='right-area'>
                    <h3>Hello Saif, How are <br />you today?</h3>
                    <div className='speak-area'>
                        <button className='cc-area'>
                            cc
                        </button>
                        <button onClick={handleConnect} disabled={isLoading} className='speak-btn'>
                            <img src={require("../../static/images/speak-area.png")} alt="" />
                        </button>
                        {connectionDetails && (
                        <LiveKitRoom
                        token={connectionDetails.participantToken}
                        serverUrl={connectionDetails.serverUrl}
                        connect={true}
                        audio={true}
                        video={false}
                        onMediaDeviceFailure={onDeviceFailure}
                        onDisconnected={handleDisconnect}
                        className="grid grid-rows-[2fr_1fr] items-center"
                        >

                        <SimpleVoiceAssistant handleVoiceAgentStateChange={handleVoiceAgentStateChange}/>
                        <VoiceAssistantControlBar
                        controls={{leave: false}}
                        />
                        <RoomAudioRenderer />
                        </LiveKitRoom>
                    )}
                        <button className='cross-area' onClick={handleDisconnect}>
                        <img src={require("../../static/images/cross-area.png")} alt="" />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Talk;

function SimpleVoiceAssistant({ handleVoiceAgentStateChange }) {
    const { state, audioTrack } = useVoiceAssistant(); // Get state and audio track from the hook

    useEffect(() => {
        handleVoiceAgentStateChange(state); // Pass the state to the parent
    }, [state, handleVoiceAgentStateChange]);

    return (
        <div className="h-80">
            <BarVisualizer state={state} trackRef={audioTrack} />
            <p className="text-center">{state}</p>
        </div>
    );
}
  
function onDeviceFailure(error) {
    console.error(error);
    alert("Error acquiring camera or microphone permissions. Please check permissions and reload.");
}
