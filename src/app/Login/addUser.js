import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

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

  // Feedback messages
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch advisors from the /getAdvisors endpoint when component mounts
  useEffect(() => {
    fetch('http://localhost:5000/getAdvisors')
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
      const response = await fetch('http://localhost:5000/users', {
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
    <div className='login-inner login-form'>
      <button className='back-btn' onClick={() => setIsVisibleAddUser(false)}>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6489 2.93463C13.244 2.33954 13.244 1.37472 12.6489 0.779634C12.0538 0.184549 11.089 0.184549 10.4939 0.779634L1.35105 9.92249C0.755968 10.5176 0.755968 11.4824 1.35105 12.0775L10.4939 21.2203C11.089 21.8154 12.0538 21.8154 12.6489 21.2203C13.244 20.6253 13.244 19.6604 12.6489 19.0653L4.58354 11L12.6489 2.93463Z" fill="#A7A7A7" />
        </svg>
      </button>
      <div className='left-area-form'>
        <div className='form-inner'>
          <div className='top-title-area'>
            <h2>Client Profile Form</h2>
          </div>
          <div className='bottom-area'>
          <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <h4>Personal Information</h4>
          <div className='group-form'>
            <label>First Name:</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className='group-form'>
            <label>Last Name:</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className='group-form'>
            <label>Date of Birth:</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          {/* Spouse Information */}
          <h4>Spouse Information (If applicable)</h4>
          <div className='group-form'>
            <label>First Name:</label>
            <input
              type="text"
              value={spouseFirstName}
              onChange={(e) => setSpouseFirstName(e.target.value)}
            />
          </div>
          <div className='group-form'>
            <label>Last Name:</label>
            <input
              type="text"
              value={spouseLastName}
              onChange={(e) => setSpouseLastName(e.target.value)}
            />
          </div>
          <div className='group-form'>
            <label>Date of Birth:</label>
            <input
              type="date"
              value={spouseDob}
              onChange={(e) => setSpouseDob(e.target.value)}
            />
          </div>

          {/* Contact Information */}
          <h4>Contact Information</h4>
          <div className='group-form'>
            <label>Home Address:</label>
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>City:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>State:</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className='group-form'>
            <label>ZIP Code:</label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Cell Phone (Client):</label>
              <input
                type="text"
                value={cellPhoneClient}
                onChange={(e) => setCellPhoneClient(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Cell Phone (Spouse):</label>
              <input
                type="text"
                value={cellPhoneSpouse}
                onChange={(e) => setCellPhoneSpouse(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>Email Address (Client):</label>
              <input
                type="email"
                value={emailClient}
                onChange={(e) => setEmailClient(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Email Address (Spouse):</label>
              <input
                type="email"
                value={emailSpouse}
                onChange={(e) => setEmailSpouse(e.target.value)}
              />
            </div>
          </div>

          {/* Family Information */}
          <h4>Family Information</h4>
          <div className='group-form'>
            <label>Children’s Names:</label>
            <input
              type="text"
              value={childrenNames}
              onChange={(e) => setChildrenNames(e.target.value)}
            />
          </div>
          <div className='group-form'>
            <label>Number of Grandchildren:</label>
            <input
              type="number"
              value={numGrandchildren}
              onChange={(e) => setNumGrandchildren(e.target.value)}
            />
          </div>

          {/* Campaign Type */}
          <h4>Campaign Type (Check all that apply)</h4>
          <div className='group-form'>
            <label>
              <input
                type="checkbox"
                name="medicare"
                checked={campaignTypes.medicare}
                onChange={handleCheckboxChange}
              />
              Medicare
            </label>
          </div>
          <div className='group-form'>
            <label>
              <input
                type="checkbox"
                name="lifeInsurance"
                checked={campaignTypes.lifeInsurance}
                onChange={handleCheckboxChange}
              />
              Life Insurance
            </label>
          </div>
          <div className='group-form'>
            <label>
              <input
                type="checkbox"
                name="wealthPlanning"
                checked={campaignTypes.wealthPlanning}
                onChange={handleCheckboxChange}
              />
              Wealth Planning
            </label>
          </div>
          <div className='group-form'>
            <label>
              <input
                type="checkbox"
                name="longTermCarePlanning"
                checked={campaignTypes.longTermCarePlanning}
                onChange={handleCheckboxChange}
              />
              Long-Term Care Planning
            </label>
          </div>

          {/* Advisor Selection */}
          <h4>Select Advisor</h4>
          <div style={{ marginBottom: '10px' }}>
            {advisors.length > 0 ? (
              advisors.map((advisor) => (
                <label
                  key={advisor}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <input
                    type="radio"
                    name="advisor"
                    value={advisor}
                    checked={advisorName === advisor}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    style={{ marginRight: '8px' }}
                  />
                  {advisor}
                </label>
              ))
            ) : (
              <p>Loading advisors...</p>
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
          <img src={require("../../static/images/login-right-img.png")} alt="" />
        </div>
      </div>
    </div>
  );
}

export default AddUser;
