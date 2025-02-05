
import React, { Component } from 'react';

import './index.css';
class Footer extends Component {


    render() {
        return (
            <div>
                <div className="emotional-health-counselling-footer" >
                    <div class="container ">
                        <div className="row footer-media-1 footer-media-2">
                            <div className="col-lg-5 col-md-12 col-12 footer-div ">
                                <div className="logo-footer ">
                                    <img src={require("../../static/images/landing/footer-logo.png")} alt="" />  
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-12 col-12 footer-div ">
                                <div className="bullet_pointer ">
                                    <h3 className="">Company</h3>
                                    <ul>
                                        <li><HashLink className='nav-link ' smooth to='/#why-dogf'>Why DOGF</HashLink></li>
                                        <li><HashLink className='nav-link ' smooth to='/#community-powered'>Community Powered</HashLink></li>
                                        <li><HashLink className='nav-link ' smooth to='/#nft'>NFT</HashLink></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-lg-3 col-md-12 col-12 footer-divs">
                                <div className="bullet_pointer ">
                                    <h3 className="">Services</h3>
                                    <ul className="">
                                        <li><HashLink className='nav-link ' smooth to='/#get-dogf'>Get DOGF</HashLink></li>
                                        <li><HashLink className='nav-link ' smooth to='/#tokenomics'>Tokenomics</HashLink></li>
                                        <li><HashLink className='nav-link ' smooth to='/#road-map'>Road Map</HashLink></li>
                                    </ul>
                                </div>
                            </div>
                            {/* <div className="col-lg-3 col-md-6 col-12 footer-divs">
                                <div className="bullet_pointer ">
                                    <h3 className="text-white">Contact Us</h3>
                                    <ul className="">
                                        <li>Address: 184 London Stret D258</li>
                                        <li>Phone: (123) 456 789</li>
                                        <li><Link to="mailto:support@Pet.com">Email: support@Pet.com</Link></li>
                                    </ul>
                                </div>
                            </div> */}
                        </div>
                        <div className="row copy-right">
                            <div className="col-lg-12 col-md-12 col-12">
                                    <p>Copyright © 2021 Dog father All rights reserved</p>
                            </div>
                            {/* <div className="col-lg-6 col-md-6 col-12">
                                <div className="rightside-footer d-flex float-right">
                                    <p className="">Follow Us:</p>
                                    <div className="footer-socialss social-ones text-center">
                                        <a target="_blank" href="https://twitter.com/merkletech" className="social-one"><span className="pr-4"><i class="fa fa-twitter" aria-hidden="true"></i></span></a>
                                    </div>
                                    <div className="footer-socialss social-twos">
                                        <a target="_blank" href="https://www.facebook.com/Merkle-Technology-112408294267594" className="social-two"> <span className="pr-4"><i class="fa fa-facebook-f" aria-hidden="true"></i></span></a>
                                    </div>
                                    <div className="footer-socialss social-threes">
                                        <a target="_blank" href="https://www.instagram.com/merkletech/" className="social-three"><span className="pr-4"><i class="fa fa-instagram" aria-hidden="true"></i></span></a>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Footer;