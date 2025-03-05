import ReactTable from 'react-table-6';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import { useHistory } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import "react-table-6/react-table.css";
import './index.css';

import MeetingDetail from './meetingDetail';
import MeetingDetailPrevious from './meetingDetailPrevious';
import {getAdvisorClients, getMeetingCount, getPreMeetingQuestions, getPreviousClients} from '../../store/config';
import { createWatchProgram } from 'typescript';


function ListMeetings() {
  const history = useHistory();
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState("");
  const [upcomingClients, setUpcomingClients] = useState([]);
  const [previousClients, setPreviousClients] = useState([]);
  const [modalProfileAdvisor, setModalProfileAdvisor] = useState(false);
  const [isVisibleMeetingDetail, setIsVisibleMeetingDetail] = useState(false);
  const [isVisibleMeetingDetailPrevious, setIsVisibleMeetingDetailPrevious] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('admin_id');

    history.push('/login');

  };

  // Fetch upcoming clients (scheduled meetings)
  useEffect(() => {
    getAdvisorClients()
      .then((data) => setUpcomingClients(data))
      .catch((error) => console.error('Error fetching clients:', error));

  }, []);

  // Fetch previous clients (completed meetings)
  useEffect(() => {
    getPreviousClients()
      .then((data) => setPreviousClients(data))
      .catch((error) => console.error('Error fetching clients:', error));


  }, []);

  useEffect(() => {
    getMeetingCount(localStorage.getItem("name"))
      .then((data) => setProfileData(data))
      .catch((error) => console.error('Error fetching meeting count:', error));

  }, []);

  // Define columns for the table.
  // Each cell is rendered as a button (to mimic your original styling).
  const columnsAgents = [
    {
      id: 'name',
      Header: 'Name',
      accessor: row => `${row.clientFirstName} ${row.clientLastName}`,
      Cell: ({ value }) => (
        <button className='btn-details-agent'>{value}</button>
      )
    },
    {
      id: 'city',
      Header: 'City',
      accessor: 'city',
      Cell: ({ value }) => (
        <button className='btn-details-agent'>{value}</button>
      )
    },
    {
      id: 'phone',
      Header: 'Phone',
      accessor: 'clientPhone',
      Cell: ({ value }) => (
        <button className='btn-details-agent'>{value}</button>
      )
    },
    {
      id: 'email',
      Header: 'Email',
      accessor: 'clientEmail',
      Cell: ({ value }) => (
        <button className='btn-details-agent'>{value}</button>
      )
    },
    {
      id: 'campaign',
      Header: 'Campaign',
      accessor: row => {
        let campaigns = [];
        if (row.medicare === 1) campaigns.push("Medicare");
        if (row.lifeInsurance === 1) campaigns.push("Life Insurance");
        if (row.wealthPlanning === 1) campaigns.push("Wealth Planning");
        if (row.LTC_Planning === 1) campaigns.push("Long-Term Care Planning");
        return campaigns.join(", ");
      },
      Cell: ({ value }) => (
        <button className='btn-details-agent'>{value}</button>
      )
    },
  ];

  const handleRowClick = (rowData) => {
    localStorage.setItem("selectedMeeting", JSON.stringify(rowData));
    setIsVisibleMeetingDetail(true);
  };

  const handleRowClick2 = (rowData) => {
    localStorage.setItem("selectedMeeting", JSON.stringify(rowData));
    setIsVisibleMeetingDetailPrevious(true);
  };

  const toggleProfileAdvisor = () => setModalProfileAdvisor(!modalProfileAdvisor);

  return (
    <div className='list-page'>
      {isVisibleMeetingDetail ? (
        <MeetingDetail isVisibleMeetingDetail={isVisibleMeetingDetail} setIsVisibleMeetingDetail={setIsVisibleMeetingDetail} />
      ) : isVisibleMeetingDetailPrevious ? (
        <MeetingDetailPrevious isVisibleMeetingDetailPrevious={isVisibleMeetingDetailPrevious} setIsVisibleMeetingDetailPrevious={setIsVisibleMeetingDetailPrevious} />
      ) : (
        <div className='list-page-inner'>
          <div className='top-nav-area'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='nav-area-inner'>
                    <div className='left-logo-area'>
                      <Link className='logo-area' to="/"><img src={require("../../static/images/logo.png")} alt="Logo" /></Link>
                    </div>
                    <div className='right-icon-area'>
                      <button className='btn-profile-img' onClick={toggleProfileAdvisor}><img src={require("../../static/images/avatar-face.png")} alt="Profile" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Banner Area */}
          <div className='banner-area'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='banner-inner'>
                    <div className='banner-content'>
                      <h2>AI-Powered Meeting<br />Management Made Simple</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings Table */}
          <div className='upcoming-meetings'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='upcoming-inner'>
                    <div className='upcoming-content'>
                      <h3>Upcoming Meetings</h3>
                      {error && <div className="error">{error}</div>}
                      <div className='table'>
                        <ReactTable
                          width='100'
                          className='table responsive meetings-table'
                          minRows={6}
                          columns={columnsAgents}
                          filterable={false}
                          showPagination={false}
                          data={upcomingClients}
                          getTrProps={(state, rowInfo) => {
                            return rowInfo
                              ? {
                                onClick: () => handleRowClick(rowInfo.original),
                                style: { cursor: 'pointer' }
                              }
                              : {};
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Previous Meetings Table */}
          <div className='upcoming-meetings'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='upcoming-inner'>
                    <div className='upcoming-content'>
                      <h3>Previous Meetings</h3>
                      <div className='table'>
                        <ReactTable
                          width='100'
                          className='table responsive meetings-table'
                          minRows={6}
                          columns={columnsAgents}
                          filterable={false}
                          showPagination={false}
                          data={previousClients}
                          getTrProps={(state, rowInfo) => {
                            return rowInfo
                              ? {
                                onClick: () => handleRowClick2(rowInfo.original),
                                style: { cursor: 'pointer' }
                              }
                              : {};
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modalProfileAdvisor} toggle={toggleProfileAdvisor} modalClassName="right" className={`main-modal right right-side-modal`}>
        <ModalHeader toggle={toggleProfileAdvisor}></ModalHeader>
        <ModalBody>
          <div className='profile-content'>
            <div className='banner-area'>
              <img src={require("../../static/images/banner-profile-img.png")} alt="" />
            </div>
            <div className='profile-img-area'>
              <img src={require("../../static/images/profile-img.png")} alt="" />
              <button className='active-btn'>Active</button>
            </div>
            <div className='name-area'>
              <h4>{localStorage.getItem("name")}</h4>
              <p>{localStorage.getItem("email")}</p>
            </div>
            <div className='pending-mettings-area'>
              <div className='pending-mettings-box'>
                <p>Pending meetings</p>
                <h4>{profileData.scheduled_meetings}</h4>
              </div>
              <div className='pending-mettings-box'>
                <p>Completed</p>
                <h4>{profileData.completed_meetings}</h4>
              </div>
            </div>
            <div className='form-area'>
              {/* 
              <div className='froup-form'>
                <label>Username</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add username'
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  // value={editState?.type || agentData?.type || ''}
                  // onChange={handleEditChange}
                  name='type'
                  style={{
                    backgroundColor: 'white'
                  }}
                />
              </div>

              <div className='froup-form'>
                <label>Email address  </label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add email'
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                  // value={editState?.type || agentData?.type || ''}
                  // onChange={handleEditChange}
                  name='type'
                  style={{
                    backgroundColor: 'white'
                  }}
                />
              </div> */}


            </div>
            <button className='btn-style-border' onClick={handleLogout}>
              Logout
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default ListMeetings;