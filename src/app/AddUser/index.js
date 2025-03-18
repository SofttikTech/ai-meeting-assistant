import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAdvisors, createUser } from '../../store/config';


const containerStyle = {
  background: 'linear-gradient(135deg, #f6d365, #fda085)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Arial, sans-serif',
  padding: '20px',
};

const formContainerStyle = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '15px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  maxWidth: '600px',
  width: '100%',
};

const headingStyle = {
  textAlign: 'center',
  marginBottom: '30px',
  color: '#333',
  fontSize: '24px',
};

const sectionHeadingStyle = {
  marginTop: '20px',
  marginBottom: '15px',
  color: '#444',
  fontSize: '18px',
  borderBottom: '2px solid #fda085',
  paddingBottom: '5px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  color: '#555',
  fontSize: '14px',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '20px',
  borderRadius: '5px',
  border: '1px solid #ccc',
  fontSize: '16px',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#f76c6c',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  marginTop: '10px',
};

function AddUser() {
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
  useEffect(() => {
    getAdvisors()
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
      try {
        const data = await createUser(payload);
        console.log('User created:', data);
      } catch (error) {
        console.error('Error creating user:', error);
      }
      // const data = await response.json();

      if (data) {
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
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h3 style={headingStyle}>Client Profile Form</h3>
        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <h4 style={sectionHeadingStyle}>Personal Information</h4>
          <div>
            <label style={labelStyle}>First Name:</label>
            <input
              style={inputStyle}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name:</label>
            <input
              style={inputStyle}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth:</label>
            <input
              style={inputStyle}
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          {/* Spouse Information */}
          <h4 style={sectionHeadingStyle}>Spouse Information (If applicable)</h4>
          <div>
            <label style={labelStyle}>First Name:</label>
            <input
              style={inputStyle}
              type="text"
              value={spouseFirstName}
              onChange={(e) => setSpouseFirstName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name:</label>
            <input
              style={inputStyle}
              type="text"
              value={spouseLastName}
              onChange={(e) => setSpouseLastName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Date of Birth:</label>
            <input
              style={inputStyle}
              type="date"
              value={spouseDob}
              onChange={(e) => setSpouseDob(e.target.value)}
            />
          </div>

          {/* Contact Information */}
          <h4 style={sectionHeadingStyle}>Contact Information</h4>
          <div>
            <label style={labelStyle}>Home Address:</label>
            <input
              style={inputStyle}
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>City:</label>
              <input
                style={inputStyle}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>State:</label>
              <input
                style={inputStyle}
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>ZIP Code:</label>
            <input
              style={inputStyle}
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cell Phone (Client):</label>
              <input
                style={inputStyle}
                type="text"
                value={cellPhoneClient}
                onChange={(e) => setCellPhoneClient(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cell Phone (Spouse):</label>
              <input
                style={inputStyle}
                type="text"
                value={cellPhoneSpouse}
                onChange={(e) => setCellPhoneSpouse(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email Address (Client):</label>
              <input
                style={inputStyle}
                type="email"
                value={emailClient}
                onChange={(e) => setEmailClient(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Email Address (Spouse):</label>
              <input
                style={inputStyle}
                type="email"
                value={emailSpouse}
                onChange={(e) => setEmailSpouse(e.target.value)}
              />
            </div>
          </div>

          {/* Family Information */}
          <h4 style={sectionHeadingStyle}>Family Information</h4>
          <div>
            <label style={labelStyle}>Children’s Names:</label>
            <input
              style={inputStyle}
              type="text"
              value={childrenNames}
              onChange={(e) => setChildrenNames(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Number of Grandchildren:</label>
            <input
              style={inputStyle}
              type="number"
              value={numGrandchildren}
              onChange={(e) => setNumGrandchildren(e.target.value)}
            />
          </div>

          {/* Campaign Type */}
          <h4 style={sectionHeadingStyle}>Campaign Type (Check all that apply)</h4>
          <div>
            <label style={labelStyle}>
              <input
                type="checkbox"
                name="medicare"
                checked={campaignTypes.medicare}
                onChange={handleCheckboxChange}
              />
              Medicare
            </label>
          </div>
          <div>
            <label style={labelStyle}>
              <input
                type="checkbox"
                name="lifeInsurance"
                checked={campaignTypes.lifeInsurance}
                onChange={handleCheckboxChange}
              />
              Life Insurance
            </label>
          </div>
          <div>
            <label style={labelStyle}>
              <input
                type="checkbox"
                name="wealthPlanning"
                checked={campaignTypes.wealthPlanning}
                onChange={handleCheckboxChange}
              />
              Wealth Planning
            </label>
          </div>
          <div>
            <label style={labelStyle}>
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
          <h4 style={sectionHeadingStyle}>Select Advisor</h4>
          <div style={{ marginBottom: '10px' }}>
            {advisors.length > 0 ? (
              advisors.map((advisor) => (
                <label
                  key={advisor}
                  style={{ ...labelStyle, display: 'flex', alignItems: 'center' }}
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

          <button type="submit" style={buttonStyle}>
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
  );
}

export default AddUser;
