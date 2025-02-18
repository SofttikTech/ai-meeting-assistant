import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';

const Login = ({ isVisible, setIsVisible }) => {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_rep'); // default selection
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleClick = () => {
    // Redirect to the "/add-user" page
    history.push('/AddUser');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/admin/login', {
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
    <div className='login-inner login-form'>
      <button className='back-btn' onClick={() => setIsVisible(false)}>
        <svg width="14" height="22" viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6489 2.93463C13.244 2.33954 13.244 1.37472 12.6489 0.779634C12.0538 0.184549 11.089 0.184549 10.4939 0.779634L1.35105 9.92249C0.755968 10.5176 0.755968 11.4824 1.35105 12.0775L10.4939 21.2203C11.089 21.8154 12.0538 21.8154 12.6489 21.2203C13.244 20.6253 13.244 19.6604 12.6489 19.0653L4.58354 11L12.6489 2.93463Z" fill="#A7A7A7" />
        </svg>
      </button>
      <div className='left-area-form'>
        <div className='form-inner'>
          <div className='top-title-area'>
            <h2>Admin Login</h2>
          </div>
          <div className='bottom-area'>
            <form onSubmit={handleSubmit}>
              <div className='group-form'>
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className='group-form'>
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className='group-form'>
                <FormControl>
                  <RadioGroup
                    aria-labelledby="demo-radio-buttons-group-label"
                    defaultValue="sales_rep"
                    name="radio-buttons-group"
                  >
                    <FormControlLabel value="sales_rep" control={<Radio checked={role === 'sales_rep'} onChange={(e) => setRole(e.target.value)} />} label="Sales Rep" />
                    <FormControlLabel value="manager" control={<Radio />} label="Manager" checked={role === 'manager'} onChange={(e) => setRole(e.target.value)} />
                  </RadioGroup>
                </FormControl>
              </div>

              <div className='group-form'>
                <button className='btn-style-new' type="submit">
                  Login
                </button>
              </div>
            </form>

            {message && <p style={{ color: 'green', marginTop: '10px', textAlign: 'center' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
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

export default Login;
