import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import { useHistory } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

const AddUser = ({ isVisibleAddUser, setIsVisibleAddUser }) => {

  const history = useHistory();

  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');

  // Spouse Information
  const [spouseFirstName, setSpouseFirstName] = useState('');
  const [spouseLastName, setSpouseLastName] = useState('');
  const [spouseDob, setSpouseDob] = useState('');

  // Contact Information
  const [homeAddress, setHomeAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [cellPhoneClient, setCellPhoneClient] = useState('');
  const [cellPhoneSpouse, setCellPhoneSpouse] = useState('');
  const [emailClient, setEmailClient] = useState('');
  const [emailSpouse, setEmailSpouse] = useState('');

  // Family Information
  const [childrenNames, setChildrenNames] = useState('');
  const [numGrandchildren, setNumGrandchildren] = useState('');

  // Campaign Type (checkboxes)
  const [campaignTypes, setCampaignTypes] = useState({
    medicare: false,
    lifeInsurance: false,
    wealthPlanning: false,
    longTermCarePlanning: false,
  });

  // Advisor Selection
  const [advisorName, setAdvisorName] = useState('');
  const [advisors, setAdvisors] = useState([]);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://3.146.37.52:4000/getAdvisors')
      .then((response) => response.json())
      .then((data) => setAdvisors(data))
      .catch((error) => console.error('Error fetching advisors:', error));
  }, []);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setCampaignTypes((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      personalInformation: {
        firstName,
        lastName,
        dob,
      },
      spouseInformation: {
        firstName: spouseFirstName,
        lastName: spouseLastName,
        dob: spouseDob,
      },
      contactInformation: {
        homeAddress,
        city,
        state: stateName,
        zipCode,
        cellPhoneClient,
        cellPhoneSpouse,
        emailClient,
        emailSpouse,
      },
      familyInformation: {
        childrenNames,
        numGrandchildren: parseInt(numGrandchildren, 10) || 0,
      },
      campaignTypes,
      advisorName,
    };

    try {
      const response = await fetch('http://3.146.37.52:4000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage('User added successfully! User ID: ' + data.user_id);
        // Reset all fields
        setFirstName('');
        setLastName('');
        setDob('');
        setSpouseFirstName('');
        setSpouseLastName('');
        setSpouseDob('');
        setHomeAddress('');
        setCity('');
        setStateName('');
        setZipCode('');
        setCellPhoneClient('');
        setCellPhoneSpouse('');
        setEmailClient('');
        setEmailSpouse('');
        setChildrenNames('');
        setNumGrandchildren('');
        setCampaignTypes({
          medicare: false,
          lifeInsurance: false,
          wealthPlanning: false,
          longTermCarePlanning: false,
        });
        setAdvisorName('');
      } else {
        setError(data.error || 'Error adding user');
      }
    } catch (err) {
      setError('An error occurred: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_id');
    localStorage.removeItem('role');
    history.push('/');
  };

  return (
    <div className='login-inner login-form cilent-form'>
      <button className='back-btn' onClick={() => setIsVisibleAddUser(false)}>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6489 2.93463C13.244 2.33954 13.244 1.37472 12.6489 0.779634C12.0538 0.184549 11.089 0.184549 10.4939 0.779634L1.35105 9.92249C0.755968 10.5176 0.755968 11.4824 1.35105 12.0775L10.4939 21.2203C11.089 21.8154 12.0538 21.8154 12.6489 21.2203C13.244 20.6253 13.244 19.6604 12.6489 19.0653L4.58354 11L12.6489 2.93463Z" fill="#A7A7A7" />
        </svg>
      </button>
      <div className='left-area-form add-user-form'>
        <div className='form-inner'>
          <div className='top-title-area'>
            <h2>Client Profile Form</h2>
          </div>
          <div className='bottom-area'>
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className='row'>
                <div className='col-12'>
                  <h4 className='group-title'>Personal Information</h4>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>First Name:</label>
                    <input
                      type="text"
                      placeholder="Add first name here"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={lastName}
                      placeholder="Add last name here"
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-12'>
                  <div className='group-form'>
                    <label>Date of Birth:</label>
                    <input
                      type="date"
                      placeholder="Date of Birth"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              {/* Spouse Information */}
              <div className='row'>
                <div className='col-12'>
                  <h4 className='group-title'>Spouse Information (If applicable)</h4>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>First Name:</label>
                    <input
                      type="text"
                      placeholder="Add first name here"
                      value={spouseFirstName}
                      onChange={(e) => setSpouseFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Last Name:</label>
                    <input
                      type="text"
                      placeholder="Add last name here"
                      value={spouseLastName}
                      onChange={(e) => setSpouseLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-12'>
                  <div className='group-form'>
                    <label>Date of Birth:</label>
                    <input
                      type="date"
                      placeholder="Date of Birth"
                      value={spouseDob}
                      onChange={(e) => setSpouseDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* Contact Information */}
              <div className='row'>
                <div className='col-12'><h4 className='group-title'>Contact Information</h4></div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Home Address:</label>
                    <input
                      type="text"
                      placeholder="Add home address here"
                      value={homeAddress}
                      onChange={(e) => setHomeAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>City:</label>
                    <input
                      type="text"
                      placeholder="Add city here"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>State:</label>
                    <input
                      type="text"
                      placeholder="Add state name here"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>ZIP Code:</label>
                    <input
                      type="text"
                      placeholder="Add zip code here"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Cell Phone (Client):</label>
                    <input
                      type="text"
                      placeholder="Add cell phone (client) here"
                      value={cellPhoneClient}
                      onChange={(e) => setCellPhoneClient(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Cell Phone (Spouse):</label>
                    <input
                      type="text"
                      placeholder="Add cell phone (Spouse) here"
                      value={cellPhoneSpouse}
                      onChange={(e) => setCellPhoneSpouse(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Email Address (Client):</label>
                    <input
                      type="email"
                      placeholder="Add email address (client) here"
                      value={emailClient}
                      onChange={(e) => setEmailClient(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Email Address (Spouse):</label>
                    <input
                      type="email"
                      placeholder="Add email address (spouse) here"
                      value={emailSpouse}
                      onChange={(e) => setEmailSpouse(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* Family Information */}
              <div className='row'>
                <div className='col-12'>
                  <h4 className='group-title'>Family Information</h4>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Children’s Names:</label>
                    <input
                      type="text"
                      placeholder="Add children’s names here"
                      value={childrenNames}
                      onChange={(e) => setChildrenNames(e.target.value)}
                    />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form'>
                    <label>Number of Grandchildren:</label>
                    <input
                      type="number"
                      placeholder="Add number of grandchildren here"
                      value={numGrandchildren}
                      onChange={(e) => setNumGrandchildren(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              {/* Campaign Type */}
              <div className='row'>
                <div className='col-12'>
                  <h4 className='group-title'>Campaign Type (Check all that apply)</h4>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form checkbox-group'>
                    <FormControlLabel control={<Checkbox name="medicare" checked={campaignTypes.medicare} onChange={handleCheckboxChange} />} label="Medicare" />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form checkbox-group'>
                    <FormControlLabel control={<Checkbox name="lifeInsurance" checked={campaignTypes.lifeInsurance} onChange={handleCheckboxChange} />} label="Life Insurance" />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form checkbox-group'>
                    <FormControlLabel control={<Checkbox name="wealthPlanning" checked={campaignTypes.wealthPlanning} onChange={handleCheckboxChange} />} label="Wealth Planning" />
                  </div>
                </div>
                <div className='col-lg-6 col-md-12'>
                  <div className='group-form checkbox-group'>
                    <FormControlLabel control={<Checkbox name="longTermCarePlanning" checked={campaignTypes.longTermCarePlanning} onChange={handleCheckboxChange} />} label="Long-Term Care Planning" />
                  </div>
                </div>
              </div>
              {/* Advisor Selection */}
              <div className='row'>
                <div className='col-12'>
                  <h4 className='group-title'>Select Advisor</h4>
                </div>
                {advisors.length > 0 ? (
                  advisors.map((advisor) => (
                    <div className='col-lg-6 col-md-12'>
                      <div className='group-form radio-group'>
                        <FormControlLabel key={advisor} value={advisor} control={<Radio value={advisor} checked={advisorName === advisor} onChange={(e) => setAdvisorName(e.target.value)}/>} label={advisor} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='col-12'>
                    <p>Loading advisors...</p>
                  </div>
                )}
              </div>
              <button type="submit" className='btn-style-new'>
                Add User
              </button>
            </form>
            {message && (
              <p style={{ color: 'green', textAlign: 'center', marginTop: '20px' }}>
                {message}
              </p>
            )}
            {error && (
              <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className='right-img-area'>
        <div className='img-box'>
          <img src={require("../../static/images/client-form-img.png")} alt="" />
        </div>
      </div>
    </div>
  );
}

export default AddUser;
