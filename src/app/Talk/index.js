import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import WOW from 'wowjs';
import axios from 'axios';
import { fetchConnectionDetails } from '../../store/config';
import {
    LiveKitRoom,
    VoiceAssistantControlBar,
    RoomAudioRenderer,
    useVoiceAssistant,
    BarVisualizer,
} from '@livekit/components-react';
import './index.css';
import '../../static/css/animate.css';
import CallingAnimation from "../Talk/callingAnimation";
import { DataContext } from "../index";
import BackgroundMusic from './BackgroundMusic';

const Talk = () => {
    const { agent } = useContext(DataContext);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLanding, setIsLanding] = useState(false);
    const [voiceState, setVoiceState] = useState('idle');
    const [agentState, setAgentState] = useState("connected");
    const [connectionDetails, setConnectionDetails] = useState(null);
    const name = sessionStorage.getItem('name');
    const [progressWidth, setProgressWidth] = useState(0);
    const [emotion, setEmotion] = useState(null);


    useEffect(() => {
        new WOW.WOW({ live: true }).init();

        return () => {
            localStorage.removeItem("name");
            localStorage.removeItem("image");
        };
    }, []);

    useEffect(() => {
        if (agentState === "disconnected") {
            setConnectionDetails(null); // Clear the connection details when disconnected
        }
    }, [agentState]);

    const handleConnect = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchConnectionDetails();
            setConnectionDetails(data);
            console.log(data);
        } catch (error) {
            setError(error.message);
            console.error("Error fetching connection details:", error);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 5000);
        }
    }, []);

    useEffect(() => {
        handleConnect();
    }, []);


    const handleVoiceAgentStateChange = (newState) => {
        setVoiceState(newState);
    };

    const handleDisconnect = () => {
        setAgentState("disconnected");
        setConnectionDetails(null);  // Stop the connection
    };

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
        } else {
            setProgressWidth(0);
        }
    }, [voiceState]);

    return (
        <div className="landing-screen">
            {/* <Link to="/ContactDetail" className='back-btn'>
                <img src={require("../../static/images/back-arrow.png")} alt="" />
            </Link> */}
            <div className='talk-area'>
                <div className='left-area'>
                    <div className='image-box'>
                        <div className='arrow-left'>
                            <img src={require("../../static/images/left-speak-arrow.png")} alt="" />
                        </div>
                        <h4>{agent?.name}</h4>
                        <div className='shadow-area'>
                            <img src={agent?.['image']} alt="" />
                        </div>
                        <div className='arrow-right'>
                            <img src={require("../../static/images/right-speak-arrow.png")} alt="" />
                        </div>
                    </div>
                    <div className='layers-area'></div>
                </div>
                <div className='right-area'>
                    {/* <h3>Hello {name}, How are <br />you today?</h3> */}
                    <div className='speak-area'>
                        <button
                            disabled={isLoading} className='speak-btn'>
                            <img src={require("../../static/images/speak-area.png")} alt="" />
                        </button>
                        {connectionDetails && (
                            <>
                                {/*<button className='cc-area'>
                                    cc
                                </button>*/}
                                <div className='butn-call'>
                                    <LiveKitRoom
                                        token={connectionDetails.participantToken}
                                        serverUrl={connectionDetails.serverUrl}
                                        connect={agentState !== 'disconnected'}
                                        audio={true}
                                        video={false}
                                        onMediaDeviceFailure={onDeviceFailure}
                                        onDisconnected={handleDisconnect}
                                        className="grid grid-rows-[2fr_1fr] items-center"
                                    >
                                        <SimpleVoiceAssistant handleVoiceAgentStateChange={handleVoiceAgentStateChange} />
                                        <VoiceAssistantControlBar controls={{ leave: false }} />
                                        <RoomAudioRenderer />
                                    </LiveKitRoom>
                                    <div>
                                        {emotion? <BackgroundMusic emotion={emotion}/> :""}
                                    </div>
                                    {/* <button className='cross-area' onClick={handleDisconnect}>
                                    <img src={require("../../static/images/cross-area.png")} alt="" />
                                </button> */}
                                    <Link className='cross-area' to="/Home" onClick={handleDisconnect}>
                                        <img src={require("../../static/images/cross-area.png")} alt="" />
                                    </Link>
                                </div>


                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Talk;

function SimpleVoiceAssistant({ handleVoiceAgentStateChange }) {
    const { state, audioTrack } = useVoiceAssistant(); // Get state and audio track from the hook

    useEffect(() => {
        handleVoiceAgentStateChange(state); // Pass the state to the parent
    }, [state, handleVoiceAgentStateChange]);

    return (
        <>
            <div className="h-80">
                <BarVisualizer state={state} trackRef={audioTrack} className='bar-custom' />
                <p className="text-center">{state}</p>
            </div>
        </>
    );
}

function onDeviceFailure(error) {
    console.error(error);
    alert("Error acquiring camera or microphone permissions. Please check permissions and reload.");
}
