import React, { useState, useEffect } from 'react';
import ReactTable from 'react-table-6';
import { Link } from 'react-router-dom';

import "react-table-6/react-table.css";
import './index.css';

import MeetingDetail from './meetingDetail';
import MeetingDetailPrevious from './meetingDetailPrevious';


function ListMeetings() {
  const [error, setError] = useState('');
  const [isVisibleMeetingDetail, setIsVisibleMeetingDetail] = useState(false);

  const [isVisibleMeetingDetailPrevious, setIsVisibleMeetingDetailPrevious] = useState(false);
  const [upcomingClients, setUpcomingClients] = useState([]);
  const [previousClients, setPreviousClients] = useState([]);

  // Fetch upcoming clients (scheduled meetings)
  useEffect(() => {
    fetch('http://localhost:5000/advisor/clients', {
      method: 'GET',
      credentials: 'include', 
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || "Failed to fetch upcoming clients"); 
          });
        }
        return response.json();
      })
      .then(data => setUpcomingClients(data))
      .catch(err => setError(err.message));
  }, []);

  // Fetch previous clients (completed meetings)
  useEffect(() => {
    fetch('http://localhost:5000/advisor/clientsPrevious', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { 
            throw new Error(err.error || "Failed to fetch previous clients"); 
          });
        }
        return response.json();
      })
      .then(data => setPreviousClients(data))
      .catch(err => setError(err.message));
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
                      <button className='btn-profile-img'><img src={require("../../static/images/avatar-face.png")} alt="Profile" /></button>
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
          {error && <div className="error">{error}</div>}
          {/* Upcoming Meetings Table */}
          <div className='upcoming-meetings'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='upcoming-inner'>
                    <div className='upcoming-content'>
                      <h3>Upcoming Meetings</h3>
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
    </div>
  );
}

export default ListMeetings;
