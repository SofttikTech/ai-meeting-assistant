import WOW from 'wowjs';
import Slider from "react-slick";
import { Link } from 'react-router-dom';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState, useRef } from 'react';

import './index.css';
import '../../static/css/animate.css';

const Home = () => {
    useEffect(() => { new WOW.WOW({ live: true }).init() }, []);

    var settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
        initialSlide: 0,
        className: "center",
        centerMode: true,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    infinite: true,
                    dots: true
                }
            },
            {
                breakpoint: 650,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 2
                }
            },
            {
                breakpoint: 610,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    return (
        <div className="landing-screen">
            <div className='contact-details'>
                <Link to="/" className='logo-area'>
                    <img src={require("../../static/images/logo.png")} alt="" />
                </Link>
                <h3><span>Who would you like to talk to?</span></h3>
                <Slider {...settings}>
                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Billy"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="37 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="American"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img-1.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Sarim"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="27 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="British"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img-2.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Lara"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="32 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="American"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Billy"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="37 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="American"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img-1.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Sarim"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="27 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="British"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className='contact-box'>
                            <div className='content-img-area'>
                                <div className='img-box'>
                                    <img src={require("../../static/images/user-img-2.png")} alt="" />
                                </div>
                                <div className='left-text-area'>
                                    <div className='group-form'>
                                        <label>Name</label>
                                        <TextField
                                            hiddenLabel
                                            id="name"
                                            name='Name'
                                            defaultValue="Lara"
                                            placeholder='Enter your name'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                    <div className='group-form'>
                                        <label>Age</label>
                                        <TextField
                                            hiddenLabel
                                            id="age"
                                            name='Age'
                                            defaultValue="32 Years"
                                            placeholder='Enter your age'
                                            variant="filled"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='group-form'>
                                <label>Country</label>
                                <TextField
                                    hiddenLabel
                                    id="country"
                                    name='Country'
                                    defaultValue="American"
                                    placeholder='Enter your Country'
                                    variant="filled"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                </Slider>

                <div className='confirm-btn'>
                    <Link to="/Talk" className='btn-from'>Confirm</Link>
                </div>
            </div>
        </div >
    );
}

export default Home;