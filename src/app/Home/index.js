import WOW from 'wowjs';
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import './index.css';
import '../../static/css/animate.css';

const Home = () => {
    const [username,setName] = useState("");
    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    // const handleSubmit = async () => {        
    //     sessionStorage.setItem('name', username);
    //     if (!username) {
    //         alert('Please enter your name');
    //         return;
    //     }
    //     try {
    //         await axios.post(
    //             'https://timyung.dev/users',
    //             { name: username },
    //             { headers: { 'Content-Type': 'application/json' } }
    //         );
            
    //         window.location.href = "/ContactDetail";
    //     } catch (error) {
    //         console.error('Error while saving user data:', error);
    //         alert('Failed to get the name. Please try again.');
    //     }
    // };

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
                            onChange={(e) => setName(e.target.value)}
                            defaultValue=""
                            placeholder='Enter your name'
                            variant="filled"
                            size="small"
                        />
                     <Link to="/Talk" className='btn-from'
                    //  onClick={() => {
                    //     handleSubmit()
                    // }}
                     >Next</Link>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Home;
