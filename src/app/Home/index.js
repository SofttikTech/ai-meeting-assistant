import WOW from 'wowjs';
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useRef } from 'react';

import './index.css';
import '../../static/css/animate.css';

const Home = () => {
    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    return (
        <div className="landing-screen">
            <div className='content-area'>
                <div className='logo-area'>
                    <img src={require("../../static/images/logo.png")} alt="" />
                </div>

                <div className='form-area'>
                    <div className='group-form'>
                        <h4><span>Your Preferred Name</span></h4>
                        <TextField
                            hiddenLabel
                            id="filled-hidden-label-small"
                            defaultValue=""
                            placeholder='Enter your name'
                            variant="filled"
                            size="small"
                        />
                        <Link to="/ContactDetail" className='btn-from'>Next</Link>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Home;