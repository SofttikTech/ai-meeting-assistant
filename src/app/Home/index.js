import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';


const containerStyle = {
  background: 'linear-gradient(135deg, #71b7e6, #9b59b6)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const formContainerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  maxWidth: '400px',
  width: '100%',
};

const headingStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  color: '#333',
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  color: '#555',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '15px',
  borderRadius: '5px',
  border: '1px solid #ccc',
};

const radioContainerStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  marginBottom: '15px',
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#9b59b6',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

function Login() {
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
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h2 style={headingStyle}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>Username:</label>
            <input
              style={inputStyle}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Password:</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={radioContainerStyle}>
            <label>
              <input
                type="radio"
                name="role"
                value="sales_rep"
                checked={role === 'sales_rep'}
                onChange={(e) => setRole(e.target.value)}
              />
              Sales Rep
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="manager"
                checked={role === 'manager'}
                onChange={(e) => setRole(e.target.value)}
              />
              Manager
            </label>
          </div>

          <button type="submit" style={buttonStyle}>
            Login
          </button>

        </form>
          <button type="submit" style={buttonStyle} className='mt-2'   onClick={handleClick}
          >
            Add Client Data
          </button>
        {message && <p style={{ color: 'green', marginTop: '10px', textAlign: 'center' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}

export default Login;
