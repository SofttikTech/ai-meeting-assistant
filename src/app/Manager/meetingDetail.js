import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { Link, useHistory } from 'react-router-dom';

import MeetingAssistant from './meetingAssistant'

import "react-table-6/react-table.css";
import './index.css';

const MeetingsDetail = ({ isVisibleMeetingDetail, setIsVisibleMeetingDetail }) => {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_rep'); // default selection
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVisibleAssistant, setIsVisibleAssistant] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://52.15.132.215:4000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_id', data.admin_id);
        localStorage.setItem('role', data.role);

        setMessage('Login successful. Redirecting...');
        setTimeout(() => {
          history.push('/Talk');
        }, 1000);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred: ' + err.message);
    }
  };


  return (
    <>
      {isVisibleAssistant
        ? <MeetingAssistant isVisibleAssistant={isVisibleAssistant} setIsVisibleAssistant={setIsVisibleAssistant} />
        : <div className='list-page-inner'>

          <div className='top-back-area'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='back-btn-area'>
                    <button className='btn-style-new' onClick={() => setIsVisibleMeetingDetail(false)}>
                      <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.57895 7.5V12.5L0 6.25L7.57895 0V5H13.8947C16.5748 5 19.1451 6.05357 21.0402 7.92893C22.9353 9.8043 24 12.3478 24 15C24 17.6522 22.9353 20.1957 21.0402 22.0711C19.1451 23.9464 16.5748 25 13.8947 25H2.52632V22.5H13.8947C15.9048 22.5 17.8325 21.7098 19.2539 20.3033C20.6752 18.8968 21.4737 16.9891 21.4737 15C21.4737 13.0109 20.6752 11.1032 19.2539 9.6967C17.8325 8.29018 15.9048 7.5 13.8947 7.5H7.57895Z" fill="currentColor" />
                      </svg>
                    </button>
                    <button className='btn-style-new' onClick={() => setIsVisibleAssistant(true)}>Start Meeting</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='information-sec'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Personal information</h3>
                    <div className='froup-form'>
                      <label>First Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Last Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        placeholder="Date of Birth"
                        // value={dob}
                        // onChange={(e) => setDob(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Spouse information (if applicable) </h3>
                    <div className='froup-form'>
                      <label>First Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Last Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        placeholder="Date of Birth"
                        // value={dob}
                        // onChange={(e) => setDob(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className='col-lg-6 col-md-12'>
                  <div className='information-box'>
                    <h3>Contact information</h3>
                    <div className='froup-form'>
                      <label>Home Address</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>City</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Cell Phone</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Email Address</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Location</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                  </div>
                </div>

                <div className='col-lg-6 col-md-12'>
                  <div className='information-box family-box'>
                    <h3>Family information</h3>
                    <div className='froup-form'>
                      <label>Children’s Name</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                      <label>Name of Grandchildren </label>
                      <TextField
                        hiddenLabel
                        variant="standard"
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
                  </div>
                </div>

                <div className='col-12'>
                  <div className='information-box'>
                    <h3>Pre meeting questions</h3>
                    <div className='qustions-box'>
                      <span>1</span>
                      <p>What is your current Medicare coverage status?</p>
                    </div>
                    <div className='qustions-box'>
                      <span>2</span>
                      <p>Are you currently experiencing any health issues?</p>
                    </div>
                    <div className='qustions-box'>
                      <span>3</span>
                      <p>Have you reviewed your Medicare options for this year?</p>
                    </div>
                    <div className='qustions-box'>
                      <span>4</span>
                      <p>Are you interested in Medicare Advantage or Supplement plans?</p>
                    </div>
                  </div>

                  {/* <div className='information-box'>
                    <h3>Summery</h3>
                    <div className='summery-box'>
                      <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </div>
                  </div>

                  <div className='information-box'>
                    <h3>Recommendation</h3>
                    <div className='summery-box'>
                      <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  );
}

export default MeetingsDetail;
