import WOW from 'wowjs';
import { useSpring, animated } from '@react-spring/web';
import React, { useEffect, useState, useRef } from 'react';

import './index.css';
import '../../static/css/animate.css';

const SplashScreen = () => {
    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    const countAnimation = useSpring({
        number: 100,
        from: { number: 0 },
        config: {
            duration: 5200,
        }
    });

    return (
        <div className="splash-screen">
            <div className='logo-area'>
                <img src={require("../../static/images/logo.png")} alt="" />
            </div>
            <div className='spiner-loader'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><linearGradient id="a11"><stop offset="0" stop-color="#fff" stop-opacity="0"></stop><stop offset="1" stop-color="#fff"></stop></linearGradient><circle fill="none" stroke="url(#a11)" stroke-width="15" stroke-linecap="round" stroke-dasharray="0 44 0 44 0 44 0 44 0 360" cx="100" cy="100" r="70" transform-origin="center"><animateTransform type="rotate" attributeName="transform" calcMode="discrete" dur="2" values="360;324;288;252;216;180;144;108;72;36" repeatCount="indefinite"></animateTransform></circle></svg>
            <animated.div>
                <animated.div className="text-counter">
                    {countAnimation.number.to(val => `${Math.floor(val)}%`)}
                </animated.div>
            </animated.div>
            </div>
        </div>
    );
}

export default SplashScreen;