import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import "react-table-6/react-table.css";
import './index.css';

const AgentProgress = ({ setIsVisibleAgentProgress }) => {
    const history = useHistory();
    const [filtersManager, setFiltersManager] = useState('');
    const [modalProfileAdvisor, setModalProfileAdvisor] = useState(false);

    const toggleProfileAdvisor = () => setModalProfileAdvisor(!modalProfileAdvisor);

    const handleFiltersManager = (event) => {
        setFiltersManager(event.target.value);
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
                {/* Top Navigation */}
                <div className='upcoming-meetings style-filter'>
                    <div className='auto-container'>
                        <div className='row'>
                            <div className='col-12'>
                                <div className='upcoming-inner'>
                                    <div className='counting-area'>
                                        <div className='counting-box'>
                                            <h3>Total Appointments</h3>
                                            <span>5321</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Appointments</h3>
                                            <span>5321</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Appointments</h3>
                                            <span>5321</span>
                                        </div>
                                        <div className='counting-box'>
                                            <h3>Total Appointments</h3>
                                            <span>5321</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ------------------ Profile Advisor Modal ------------------ */}
            <Modal isOpen={modalProfileAdvisor} toggle={toggleProfileAdvisor} modalClassName="right" className="main-modal right right-side-modal">
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
                                        value={filtersManager}
                                        onChange={handleFiltersManager}
                                        displayEmpty
                                        inputProps={{ 'aria-label': 'Without label' }}
                                        MenuProps={{
                                            PaperProps: {
                                                className: "select-panel-dropdown",
                                            },
                                        }}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Filters Select</em>
                                        </MenuItem>
                                        <MenuItem value="Advisor">Advisor</MenuItem>
                                        <MenuItem value="Manager">Manager</MenuItem>
                                        <MenuItem value="Nnew">Nnew</MenuItem>
                                        <MenuItem value="New Manager">New Manager</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </div>

                        <button className='btn-style-border' >Submit</button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
}

export default AgentProgress;
