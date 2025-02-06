import WOW from 'wowjs';
import { Link } from 'react-router-dom';
import AudioPlayer from 'react-h5-audio-player';
import React, { useEffect, useState, useRef } from 'react';

import './index.css';
import 'react-h5-audio-player/lib/styles.css';
import '../../static/css/animate.css';

const tracks = [
    {
        url: "https://assets-emotional-health-counselling.s3.ap-southeast-1.amazonaws.com/rotery_ring.mp3",
        title: "rignging",
        tags: ["rignging"],
    }
];

const CallingAnimation = () => {
    const player = useRef();
    const [trackIdx, setTrackIdx] = useState(0);
    const handleChangeAudio = () => setTrackIdx((trackIdx) => trackIdx < tracks.length - 1 ? trackIdx + 1 : 0);
    const handleEnterWebsite = () => {
        player?.current?.audio?.current.play();
      };

    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    return (
        <div className="landing-screen">
            <div className="caling-app">
                <AudioPlayer
                    ref={player}
                    showSkipControls
                    autoPlay
                    showJumpControls={false}
                    autoPlayNextTrack={true}
                    src={tracks[trackIdx].url}
                    header={`${tracks[trackIdx].title}`}
                    onEnded={handleChangeAudio}
                    showFilledVolume={true}
                    onPlay={e => console.log("onPlay")}
                    onClickNext={handleChangeAudio}
                    onClick={handleEnterWebsite}
                />
                <img src={require("../../static/images/call.gif")} alt="" />
            </div >
        </div>
    );
}

export default CallingAnimation;