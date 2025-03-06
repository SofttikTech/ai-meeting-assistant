import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import AddUser from './addUser';
import AdminLogin from './adminLogin';

import './index.css';

function Login() {
  const history = useHistory();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleAddUser, setIsVisibleAddUser] = useState(false);
  const [role, setRole] = useState('sales_rep'); // default selection

  return (
    <div className='login-page'>
      {isVisible ? (
        <AdminLogin isVisible={isVisible} setIsVisible={setIsVisible}/>
      ) : isVisibleAddUser ? (
        <AddUser isVisibleAddUser={isVisibleAddUser} setIsVisibleAddUser={setIsVisibleAddUser} />
      ) : (
        <div className='login-inner login-main-page'>
          <div className='left-area-form'>
            <div className='form-inner'>
              <div className='top-title-area'>
                <div className='logo-area'><img src={require("../../static/images/logo.png")} alt="" /></div>
                <h2>Welcome <i className='icon'><img src={require("../../static/images/welcome-icon.png")} alt="" /></i></h2>
                <h4 className='ponnala-regular'>EPIPHANY</h4>
                <p>Financial Group, LLC </p>
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
              <img src={require("../../static/images/login-right-img-main.png")} alt="" />
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
