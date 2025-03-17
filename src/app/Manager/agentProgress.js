import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { getFilteredMeetingStats } from '../../store/config';

import "react-table-6/react-table.css";
import './index.css';

const AgentProgress = ({ setIsVisibleAgentProgress, meetingStats, userId }) => {
    const history = useHistory();
    const [stats, setStats] = useState(meetingStats);
    const [campaign, setCampaign] = useState('');
    const [modalProfileAdvisor, setModalProfileAdvisor] = useState(false);
    const [loadingFilter, setLoadingFilter] = useState(false);
    const [error, setError] = useState(null);

    const toggleProfileAdvisor = () => setModalProfileAdvisor(!modalProfileAdvisor);

    const handleCampaignChange = (event) => {
        setCampaign(event.target.value);
    };

    const handleFilterSubmit = async () => {
        if (!campaign) return; 
        setLoadingFilter(true);
        setError(null);
        try {
            const filteredStats = await getFilteredMeetingStats(userId, campaign);
            setStats(filteredStats);
            toggleProfileAdvisor();
          } catch (err) {
            console.error("Filter error:", err);
            setError(err.message);
          } finally {
            setLoadingFilter(false);
          }
    };

    return (
        <div className='list-page'>
            <div className='list-page-inner'>
                {/* Top Navigation */}
                <div className='top-nav-area'>
                    <div className='auto-container'>
                        <div className='row'>
                            <div className='col-12'>
                                <div className='nav-area-inner'>
                                    <div className='left-logo-area'>
                                        <button className="btn-style-new" onClick={() => setIsVisibleAgentProgress(false)}>
                                            <svg
                                                width="24"
                                                height="25"
                                                viewBox="0 0 24 25"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M7.57895 7.5V12.5L0 6.25L7.57895 0V5H13.8947C16.5748 5 19.1451 6.05357 21.0402 7.92893C22.9353 9.8043 24 12.3478 24 15C24 17.6522 22.9353 20.1957 21.0402 22.0711C19.1451 23.9464 16.5748 25 13.8947 25H2.52632V22.5H13.8947C15.9048 22.5 17.8325 21.7098 19.2539 20.3033C20.6752 18.8968 21.4737 16.9891 21.4737 15C21.4737 13.0109 20.6752 11.1032 19.2539 9.6967C17.8325 8.29018 15.9048 7.5 13.8947 7.5H7.57895Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className='right-icon-area'>
                                        <button className="filter-btn" onClick={toggleProfileAdvisor}>
                                            <img src={require("../../static/images/fillter-btn.png")} alt="" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Dynamic Progress Section */}
                <div className='upcoming-meetings style-filter'>
                    <div className='auto-container'>
                        <div className='row'>
                            <div className='col-12'>
                                <div className='upcoming-inner'>
                                    <div className='counting-area'>
                                        <div className='counting-box'>
                                            <h3>Total Appointments</h3>
                                            <span>{stats ? stats.total_appointments : 0}</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Asks</h3>
                                            <span>{stats ? stats.total_asks : 0}</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Submissions</h3>
                                            <span>{stats ? stats.total_submissions : 0}</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Referrals</h3>
                                            <span>{stats ? stats.total_referrals : 0}</span>
                                        </div>
                                    </div>
                                    {error && <p className="error-message">{error}</p>}
                                    {loadingFilter && <p>Loading filtered data...</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Filter Modal */}
            <Modal 
                isOpen={modalProfileAdvisor} 
                toggle={toggleProfileAdvisor} 
                modalClassName="right" 
                className="main-modal right right-side-modal"
            >
                <ModalHeader toggle={toggleProfileAdvisor}></ModalHeader>
                <ModalBody>
                    <div className='profile-content'>
                        <div className='banner-area'>
                            <img src={require("../../static/images/banner-profile-img.png")} alt="" />
                        </div>
                        <div className='name-area'>
                            <h4>Filters Role</h4>
                            <div className='select-box'>
                                <FormControl sx={{ m: 1, minWidth: 120 }}>
                                    <Select
                                        value={campaign}
                                        onChange={handleCampaignChange}
                                        displayEmpty
                                        inputProps={{ 'aria-label': 'Without label' }}
                                        MenuProps={{
                                            PaperProps: {
                                                className: "select-panel-dropdown",
                                            },
                                        }}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Select Campaign</em>
                                        </MenuItem>
                                        <MenuItem value="medicare">Medicare</MenuItem>
                                        <MenuItem value="lifeInsurance">Life Insurance</MenuItem>
                                        <MenuItem value="wealthPlanning">Wealth Planning</MenuItem>
                                        <MenuItem value="longTermCare">Long Term Care</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </div>
                        <button className='btn-style-border' onClick={handleFilterSubmit}>
                            Submit
                        </button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
}

export default AgentProgress;
