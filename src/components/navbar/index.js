import React from 'react';
import { Link } from 'react-router-dom';

import './index.css';

const Navbar = () => {

    return (
        <div className="ai-meeting-assistant-nav">
            <nav className='navbar navbar-expand-lg sidenav' id="sidenav-1" data-mdb-hidden="false">
                <div className='container-fluid'>
                    <div className="inner-container">
                        {/* <Link className='navbar-brand' to='#'><img src={require('../../static/images/logo.png')} alt='' /></Link> */}
                        <div className=' navbar-collapse nav-links' id='navbarSupportedContent'>
                            <ul className='navbar-nav sidenav-menu'>
                                <li className='nav-item'>
                                    <a className='nav-link' href='http://x.com/TronDogOfficial' target='_blank'>twitter</a>
                                </li>
                                <li className='nav-item'>
                                    <a className='nav-link' href='http://t.co/TronDogOfficial' target="_blank">TELEGRAm</a>
                                </li>
                            </ul>
                            {/* <div className='wallet-btn'>
                                <Link to="#">connect wallet</Link>
                            </div> */}
                        </div>
                    </div>
                </div>
            </nav>
            {/* <div className="whatsapp-swipe">
                <ul>
                    <li><a href="https://dexscreener.com/solana/2GCKQBYot4uFyauVJvcZhiQP8gXgiNQJuYVAo6SVeUti" target="_blank" className="whatsapp-icon" rel="nofollow noopener"></a></li>
                    <li><a href="https://raydium.io/swap/?inputMint=sol&outputMint=2GCKQBYot4uFyauVJvcZhiQP8gXgiNQJuYVAo6SVeUti" target="_blank" className="skype-icon" rel="nofollow noopener"></a></li>
                </ul>
            </div> */}
        </div>
    );
}
export default Navbar;