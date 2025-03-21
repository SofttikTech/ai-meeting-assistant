import { useHistory } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';

import MeetingAssistant from './meetingAssistant';
import {StorePreMeetingQuestions} from '../../store/config';
import { fetchPreMeetingQuestions, getCampaignD } from '../../store/config';

import "react-table-6/react-table.css";
import './index.css';

const MeetingsDetail = ({ setIsVisibleMeetingDetail }) => {
  const history = useHistory();
  const [summary, setSummary] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [isVisibleAssistant, setIsVisibleAssistant] = useState(false);

  const getCampaign = async (id) => {
    const data  = await getCampaignD(id);
    console.log("Campaign data:", data);
  };

  useEffect(() => {
    const storedMeeting = localStorage.getItem("selectedMeeting");
    if (storedMeeting) {
      const meeting = JSON.parse(storedMeeting);
      setSelectedMeeting(meeting);
      getCampaign(meeting.id);
      console.log(meeting)
      let value = "";

      if (meeting.medicare === 1) value = "medicare";
      if (meeting.wealthPlanning === 1) value = "wealthPlanning";
      if (meeting.lifeInsurance === 1) value = "lifeInsurance";
      if (meeting.LTC_Planning === 1) value = "LTC_Planning";

      
      localStorage.setItem("user_id",meeting.id)
      localStorage.setItem("FirstName",meeting.clientFirstName)
      localStorage.setItem("LastName",meeting.clientLastName)
      localStorage.setItem("email",meeting.clientEmail)
      localStorage.setItem("phoneNumber",meeting.clientPhone)
      localStorage.setItem("meetingType",meeting.meetingType)
      localStorage.setItem("campaign",value)
      fetchPreMeetingQuestions(meeting.id)
      .then((data) => {
        if (data.questions) {
          setSummary(data.questions);
          storePreMeetingQuestions(meeting.id, data.questions)
        } else {
            setSummary(data);
        }
        setLoadingSummary(false);
      })
      .catch((error) => {
        console.error('Error fetching clients:', error)
        setLoadingSummary(false);
      });
    } else {
      setLoadingSummary(false);
    }

  }, []);

  const storePreMeetingQuestions = async (userId, questions) => {
    try {
      const response = await StorePreMeetingQuestions(userId, questions);
      console.log(response)
    } catch (err) {
      console.log(err)
    }

    //   const campaignResponse = await fetch(`http://3.146.37.52:4000/campaign/${userId}`, {
    //     method: 'GET',
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    //   const campaignData = await campaignResponse.json();
    //   if (!campaignResponse.ok) {
    //     console.error("Error retrieving campaign:", campaignData.error);
    //   } else {
    //     console.log("Campaign data:", campaignData);
    //     // Optionally, you can process campaignData further here.
    //   }
    // } catch (error) {
    //   console.error("Error:", error);
    // }
  };


  useEffect(() => {
    return () => {
      localStorage.removeItem("selectedMeeting");
    };
  }, []);

  return (
    <>
      {isVisibleAssistant ? (
        <MeetingAssistant
          isVisibleAssistant={isVisibleAssistant}
          setIsVisibleAssistant={setIsVisibleAssistant}
        />
      ) : (
        <div className='list-page-inner'>
          <div className='top-back-area'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='back-btn-area'>
                    <button
                      className='btn-style-new'
                      onClick={() => setIsVisibleMeetingDetail(false)}
                    >
                      <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.57895 7.5V12.5L0 6.25L7.57895 0V5H13.8947C16.5748 5 19.1451 6.05357 21.0402 7.92893C22.9353 9.8043 24 12.3478 24 15C24 17.6522 22.9353 20.1957 21.0402 22.0711C19.1451 23.9464 16.5748 25 13.8947 25H2.52632V22.5H13.8947C15.9048 22.5 17.8325 21.7098 19.2539 20.3033C20.6752 18.8968 21.4737 16.9891 21.4737 15C21.4737 13.0109 20.6752 11.1032 19.2539 9.6967C17.8325 8.29018 15.9048 7.5 13.8947 7.5H7.57895Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      className='btn-style-new'
                      onClick={() => setIsVisibleAssistant(true)}
                    >
                      Start Meeting
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='information-sec'>
            <div className='auto-container'>
              <div className='row'>
                {/* Personal Information */}
                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Personal information</h3>
                    <div className='froup-form'>
                      <label>First Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.clientFirstName || ''}
                        name='firstName'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Last Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.clientLastName || ''}
                        name='lastName'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={selectedMeeting.clientDOB ? new Date(selectedMeeting.clientDOB).toISOString().split('T')[0] : ''}
                        required
                      />
                    </div>
                  </div>
                </div>
                {/* Spouse Information */}
                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Spouse information (if applicable)</h3>
                    <div className='froup-form'>
                      <label>First Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.spouseFirstName || ''}
                        name='spouseFirstName'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Last Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.spouseLastName || ''}
                        name='spouseLastName'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={selectedMeeting.spouseDOB ? new Date(selectedMeeting.spouseDOB).toISOString().split('T')[0] : ''}
                        required
                      />
                    </div>
                  </div>
                </div>
                {/* Contact Information */}
                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Contact information</h3>
                    <div className='froup-form'>
                      <label>Home Address</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.address || ''}
                        name='address'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>City</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.city || ''}
                        name='city'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Cell Phone</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.clientPhone || ''}
                        name='clientPhone'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Email Address</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.clientEmail || ''}
                        name='clientEmail'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Location</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.city || ''}
                        name='location'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                </div>
                {/* Family Information */}
                <div className='col-lg-6 col-md-12'>
                  <div className='information-box family-box'>
                    <h3>Family information</h3>
                    <div className='froup-form'>
                      <label>Children’s Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.childrenNames || ''}
                        name='childrenNames'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                    <div className='froup-form'>
                      <label>Name of Grandchildren</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        size="small"
                        value={selectedMeeting.grandChildren || ''}
                        name='grandChildren'
                        style={{ backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                </div>
                {/* Dynamic Sections */}
                <div className='col-12'>
                  <div className='information-box'>
                    <h3>Pre meeting questions</h3>
                    {loadingSummary ? (
                      <p>Processing...</p>
                    ) : (
                      summary ? (
                        summary
                          .split(/\d+\.\s/)
                          .filter(q => q.trim() !== "")
                          .map((question, index) => (
                            <div className='qustions-box' key={index}>
                              <span>{index + 1}</span>
                              <p>{question}</p>
                            </div>
                          ))
                      ) : (
                        <p>No pre meeting questions available.</p>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MeetingsDetail;
