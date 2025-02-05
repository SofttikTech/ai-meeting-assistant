import WOW from 'wowjs';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';

import './index.css';
import '../../static/css/animate.css';

const CallingAnimation = () => {
    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    return (
        <div className="landing-screen">
            <div className="caling-app">
                <img src={require("../../static/images/call.gif")} alt="" />
            </div >
        </div>
    );
}

export default CallingAnimation;