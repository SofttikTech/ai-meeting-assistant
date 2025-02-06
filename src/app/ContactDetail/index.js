import WOW from 'wowjs';
import axios from 'axios';
import Slider from "react-slick";
import { selectCard } from '../../store/config';
import TextField from '@mui/material/TextField';
import { Link, useHistory } from 'react-router-dom';
import { AirportShuttle } from '@material-ui/icons';
import React, { useEffect, useState, useContext, useRef } from 'react';

import { DataContext } from '../index';
import './index.css';
import '../../static/css/animate.css';
// const characters = [
//     {
//         CharacterName: 'Daniel',
//         Age: '37 Years',
//         Country: 'American',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img-1.png',
//     },
//     {
//         CharacterName: 'Lily',
//         Age: '27 Years',
//         Country: 'British',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img-2.png',
//     },
//     {
//         CharacterName: 'Charlie',
//         Age: '32 Years',
//         Country: 'American',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img.png',
//     },
//     {
//         CharacterName: 'Michael',
//         Age: '37 Years',
//         Country: 'American',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img-3.png',
//     },
//     {
//         CharacterName: 'Paul',
//         Age: '27 Years',
//         Country: 'British',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img-4.png',
//     },
//     {
//         CharacterName: 'Domi',
//         Age: '32 Years',
//         Country: 'American',
//         PicturePath: 'https://dqkn19v4jicyt.cloudfront.net/user-img-5.png',
//     },
// ]

const Home = () => {
    const player = useRef();
    const { agent, setAgent } = useContext(DataContext);
    const [currentSlide, setCurrentSlide] = useState(() => {
        return parseInt(localStorage.getItem('currentSlide'), 10) || 0;
    });
    const navigate = useHistory();
    const [characters, setCharacters] = useState([]);
    const [error, setError] = useState(null);

    // Fetch characters data from the Flask API
    useEffect(() => {
        axios.get('https://timyung.dev/characters')
            .then((response) => {
                setCharacters(response.data);
            })
            .catch((error) => {
                setError('Error fetching data');
            });
    }, []);


    useEffect(() => {
        new WOW.WOW({ live: true }).init();
    }, []);

    const handleConfirmClick = async () => {
        // The center card's number is (currentSlide + 1)
        const selectedAgent = characters[currentSlide];
        setAgent({
            name: selectedAgent?.CharacterName,
            image: selectedAgent?.PicturePath,
        });

        const cardNumber = currentSlide + 1;
        console.log(cardNumber);

        try {
            const data = await selectCard(cardNumber);
            console.log("Response from backend:", data);
            window.location.href = "/Talk";
        } catch (error) {
            console.error("Error during card selection:", error);
        }

        player?.current?.audio?.current.play();
    };

    const handleSession = async () => {
        try {
            const data = {
                username: sessionStorage.getItem('name'),
                CharacterName: characters[currentSlide].CharacterName
            };

            console.log('Sending data:', data);  // Log the data

            await axios.post(
                'https://timyung.dev/addsessions',
                data,
                {
                    headers: { 'Content-Type': 'application/json' },
                }

            );
        } catch (error) {
            console.error('Error while creating session:', error);
            alert('Failed to create session.');
        }
    };


    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
        initialSlide: 0,
        className: "center",
        centerMode: true,
        initialSlide: currentSlide, // Set the initial slide to the last saved index
        beforeChange: (_, newIndex) => {
            setCurrentSlide(newIndex);
            localStorage.setItem('currentSlide', newIndex); // Save the current slide index to localStorage
        },
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
                    {characters.map((item, index) => (
                        <div key={index}>
                            <div className='contact-box'>
                                <div className='content-img-area'>
                                    <div className='img-box'>
                                        {item?.PicturePath && (
                                            <img
                                                src={item.PicturePath}
                                                alt="Agent"
                                            />
                                        )}
                                    </div>
                                    <div className='left-text-area'>
                                        <div className='group-form'>
                                            <label>Name</label>
                                            <TextField
                                                hiddenLabel
                                                id="name"
                                                name='Name'
                                                value={item.CharacterName}
                                                // placeholder='Enter your name'
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
                                                value={item.Age}
                                                // placeholder='Enter your age'
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
                                        value={item.Country}
                                        // placeholder='Enter your Country'
                                        variant="filled"
                                        size="small"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                </Slider>

                <div className='confirm-btn'>
                    <button onClick={() => {
                        handleConfirmClick()
                        handleSession()
                    }} className='btn-from'>Confirm</button>
                </div>
            </div>
        </div >
    );
}

export default Home;
