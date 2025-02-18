import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import AddUser from './addUser';
import AdminLogin from './adminLogin';

import './index.css';

function Login() {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_rep'); // default selection
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleAddUser, setIsVisibleAddUser] = useState(false);

  const handleClick = () => {
    // Redirect to the "/add-user" page
    // history.push('/AddUser');
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
    <div className='login-page'>
      {isVisible ? (
        <AdminLogin isVisible={isVisible} setIsVisible={setIsVisible}/>
      ) : isVisibleAddUser ? (
        <AddUser isVisibleAddUser={isVisibleAddUser} setIsVisibleAddUser={setIsVisibleAddUser} />
      ) : (
        <div className='login-inner'>
          <div className='left-area-form'>
            <div className='form-inner'>
              <div className='top-title-area'>
                <h2>Welcome <i className='icon'><img src={require("../../static/images/welcome-icon.png")} alt="" /></i></h2>
                <h4 className='ponnala-regular'>AI Meeting Assistant</h4>
              </div>
              <div className='bottom-area'>
                <button type="submit" className='btn-style-new' onClick={() => setIsVisibleAddUser(true)}>
                  Add your details
                </button>
                <button type="submit" className='btn-style-border' onClick={() => setIsVisible(true)}>
                  Admin Login
                </button>
              </div>
            </div>
          </div>
          <div className='right-img-area'>
            <div className='img-box'>
              <img src={require("../../static/images/right-buttn-img.png")} alt="" />
            </div>
          </div>
        </div>
      )}

      {/* <div>
        <h2>Admin Login</h2>
        
      </div> */}
    </div>
  );
}

export default Login;
