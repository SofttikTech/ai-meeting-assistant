import ReactTable from 'react-table-6';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import { Link, useHistory } from 'react-router-dom';
import { Modal, ModalBody, ModalHeader, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';

import "react-table-6/react-table.css";
import './index.css';


function ListMeetings() {
  const history = useHistory();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_rep'); // default selection
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalEditAdvisor, setModalEditAdvisor] = useState(false);
  const [modalDeleteAdvisor, setModalDeleteAdvisor] = useState(false);
  const [modalAddNewAdvisor, setModalAddNewAdvisor] = useState(false);
  const [modalProfileAdvisor, setModalProfileAdvisor] = useState(false);
  const toggleDropDwon = () => setDropdownOpen((prevState) => !prevState);

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

  const toggleEditAdvisor = () => setModalEditAdvisor(!modalEditAdvisor);
  const toggleDeleteAdvisor = () => setModalDeleteAdvisor(!modalDeleteAdvisor);
  const toggleAddNewAdvisor = () => setModalAddNewAdvisor(!modalAddNewAdvisor);
  const toggleProfileAdvisor = () => setModalProfileAdvisor(!modalProfileAdvisor);

  const dataManageAdvisors = [{
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
        <Dropdown className="create-btn dropdwon-email" isOpen={dropdownOpen} toggle={toggleDropDwon}>
          <DropdownToggle>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#242424" />
              <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="#242424" />
              <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="#242424" />
            </svg>
          </DropdownToggle>
          <DropdownMenu>
            <DropdownItem onClick={toggleEditAdvisor}>
              <div className='dropdwon-detail'>
                <i className='icon'>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 15H15.75" stroke="#505050" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M12.375 2.625C12.6734 2.32663 13.078 2.15901 13.5 2.15901C13.7089 2.15901 13.9158 2.20016 14.1088 2.28012C14.3019 2.36007 14.4773 2.47726 14.625 2.625C14.7727 2.77274 14.8899 2.94813 14.9699 3.14115C15.0498 3.33418 15.091 3.54107 15.091 3.75C15.091 3.95893 15.0498 4.16582 14.9699 4.35885C14.8899 4.55187 14.7727 4.72726 14.625 4.875L5.25 14.25L2.25 15L3 12L12.375 2.625Z" stroke="#505050" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </i>
                <p>Edit</p>
              </div>
            </DropdownItem>
            <DropdownItem onClick={toggleDeleteAdvisor}>
              <div className='dropdwon-detail'>
                <i className='icon'>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.25 4.5H3.75H15.75" stroke="#E43F52" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M14.25 4.5V15C14.25 15.3978 14.092 15.7794 13.8107 16.0607C13.5294 16.342 13.1478 16.5 12.75 16.5H5.25C4.85218 16.5 4.47064 16.342 4.18934 16.0607C3.90804 15.7794 3.75 15.3978 3.75 15V4.5M6 4.5V3C6 2.60218 6.15804 2.22064 6.43934 1.93934C6.72064 1.65804 7.10218 1.5 7.5 1.5H10.5C10.8978 1.5 11.2794 1.65804 11.5607 1.93934C11.842 2.22064 12 2.60218 12 3V4.5" stroke="#E43F52" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M7.5 8.25V12.75" stroke="#E43F52" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M10.5 8.25V12.75" stroke="#E43F52" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </i>
                <p>Delete</p>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>

      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>

      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>

      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>

      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
      </div>,
  }, {
    usernameAdvisors: <button className='btn-details-agent'>James William</button>,
    password: <button className='btn-details-agent'>P123456</button>,
    email: <button className='btn-details-agent'>jameswilliam0@gmail.com</button>,
    role: <button className='btn-details-agent'>Advisor</button>,
    action:
      <div className='content-area'>
      </div>,
  },];

  const columnsManageAdvisors = [{
    id: 'usernameAdvisors',
    Header: 'Username',
    accessor: 'usernameAdvisors'
  },
  {
    id: 'password',
    Header: 'Password',
    accessor: 'password'

  }, {
    id: 'email',
    Header: 'Email',
    accessor: 'email'

  },
  {
    id: 'role',
    Header: 'Role',
    accessor: 'role'

  },

  {
    id: 'action',
    minWidth: 30,
    Header: '',
    accessor: 'action'

  },];

  return (
    <div className='list-page'>
      <div className='list-page-inner'>
        <div className='top-nav-area'>
          <div className='auto-container'>
            <div className='row'>
              <div className='col-12'>
                <div className='nav-area-inner'>
                  <div className='left-logo-area'>
                    <Link className='logo-area' to="/"><img src={require("../../static/images/logo.png")} alt="" /></Link>
                  </div>
                  <div className='right-icon-area'>
                    <button className='btn-profile-img' onClick={toggleProfileAdvisor}><img src={require("../../static/images/avatar-face.png")} alt="" /></button>
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
        {/* Upcoming Meetings */}
        <div className='upcoming-meetings'>
          <div className='auto-container'>
            <div className='row'>
              <div className='col-12'>
                <div className='upcoming-inner'>
                  <div className='upcoming-content'>
                    <div className='advisor-title'>
                      <h3>Manage Advisors</h3>
                      <button className='btn-style-new' onClick={toggleAddNewAdvisor}>Add Advisor</button>
                    </div>
                    <div className='table'>
                      <ReactTable
                        width='100'
                        className='table responsive meetings-table'
                        minRows={6}
                        columns={columnsManageAdvisors}
                        filterable={false}
                        showPagination={false}
                        data={dataManageAdvisors}
                      // defaultFilterMethod={filterCaseInsensitive}
                      // resolveData={allCampaign => allCampaign.map(row => row)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------- Add New Advisor--------------- */}
      <Modal isOpen={modalAddNewAdvisor} className={`main-modal new-advisor-modal modal-dialog-centered`}>
        <ModalHeader toggle={toggleAddNewAdvisor}></ModalHeader>
        <ModalBody>
          <div className='add-content'>
            <h2>Add Advisor</h2>
            <div className='form-area'>
              <div className='froup-form'>
                <label>Name</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add username'
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
                <label>Password</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Set password'
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
                <label>Email</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add email'
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

              <div className='froup-form btn-groups'>
                <button className='btn-style-border'>Cancel</button>
                <button className='btn-style-new'>Add</button>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* --------------- Edit Advisor--------------- */}
      <Modal isOpen={modalEditAdvisor} className={`main-modal new-advisor-modal modal-dialog-centered`}>
        <ModalHeader toggle={toggleEditAdvisor}></ModalHeader>
        <ModalBody>
          <div className='add-content'>
            <h2>Edit Advisor</h2>
            <div className='form-area'>
              <div className='froup-form'>
                <label>Name</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add username'
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
                <label>Password</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Set password'
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
                <label>Email</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add email'
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

              <div className='froup-form btn-groups'>
                <button className='btn-style-border'>Cancel</button>
                <button className='btn-style-new'>Add</button>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>


      {/* --------------- Delete Advisor--------------- */}
      <Modal isOpen={modalDeleteAdvisor} className={`main-modal new-advisor-modal modal-dialog-centered`}>
        <ModalHeader toggle={toggleDeleteAdvisor}></ModalHeader>
        <ModalBody>
          <div className='add-content'>
            <div className='delete-modal'>
              <h4>
                <i className='icon'>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 4C0 1.79086 1.79086 0 4 0H20C22.2091 0 24 1.79086 24 4V20C24 22.2091 22.2091 24 20 24H4C1.79086 24 0 22.2091 0 20V4Z" fill="#FF3B30" fill-opacity="0.15" />
                    <path d="M12 19.5C16.1421 19.5 19.5 16.1421 19.5 12C19.5 7.85786 16.1421 4.5 12 4.5C7.85786 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85786 19.5 12 19.5Z" fill="#FF3B30" />
                    <path d="M12 9V12" stroke="#FFE2E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M12 15H12.0083" stroke="#FFE2E0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </i>
                Delete Advisor
              </h4>
              <p>Are your sure you want to delete Advisor?</p>
              <div className='form-area'>
                <div className='btns-box text-right'>
                  <button className='btn-style-border'>Cancel</button>
                  <button className='btn-style-new'>Save</button>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>


      <Modal isOpen={modalProfileAdvisor} toggle={toggleProfileAdvisor} modalClassName="right" className={`main-modal right right-side-modal`}>
        <ModalHeader toggle={toggleProfileAdvisor}></ModalHeader>
        <ModalBody>
          <div className='profile-content'>
            <div className='banner-area'>
              <img src={require("../../static/images/banner-profile-img.png")} alt="" />
            </div>
            <div className='profile-img-area'>
              <img src={require("../../static/images/profile-img.png")} alt="" />
              <button className='active-btn'>Active</button>
            </div>
            <div className='name-area'>
                  <h4> Henry king</h4>
                  <p> henryking23@gmail.com</p>
            </div>
            <div className='pending-mettings-area'>
                  <div className='pending-mettings-box'>
                      <p>Pending meetings</p>
                      <h4>10</h4>
                  </div>
                  <div className='pending-mettings-box'>
                      <p>Completed</p>
                      <h4>25</h4>
                  </div>
            </div>

            <div className='form-area'>
              <div className='froup-form'>
                <label>Username</label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add username'
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
                <label>Email address  </label>
                <TextField
                  hiddenLabel
                  variant="standard"
                  placeholder='Add email'
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
            <button className='btn-style-border'>Logout</button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default ListMeetings;
