import React, { useState } from 'react';
import ReactTable from 'react-table-6';
import { Link, useHistory } from 'react-router-dom';

import "react-table-6/react-table.css";
import './index.css';

import MeetingDetail from './meetingDetail';
import MeetingDetailPrevious from './meetingDetailPrevious';

function ListMeetings() {
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales_rep'); // default selection
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVisibleMeetingDetail, setIsVisibleMeetingDetail] = useState(false);
  const [isVisibleMeetingDetailPrevious, setIsVisibleMeetingDetailPrevious] = useState(false);

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


  const dataUpcomingMeetings = [{
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetail(true)}>Long-Term Care Planning</button>,
  },];

  const columnsUpcomingMeetings = [{
    id: 'name',
    Header: 'Name',
    accessor: 'name'
  },
  {
    id: 'city',
    Header: 'City',
    accessor: 'city'

  },
  {
    id: 'phone',
    Header: 'Phone',
    accessor: 'phone'

  },
  {
    id: 'email',
    Header: 'Email',
    accessor: 'email'

  },
  {
    id: 'campaign',
    Header: 'Campaign',
    accessor: 'campaign'

  },];


  const dataPreviousMeetings = [{
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  }, {
    name: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>James William</button>,
    city: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>New York </button>,
    phone: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>+1 234-567-89</button>,
    email: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>jameswilliam0@gmail.com</button>,
    campaign: <button className='btn-details-agent' onClick={() => setIsVisibleMeetingDetailPrevious(true)}>Long-Term Care Planning</button>,
  },];

  const columnsPreviousMeetings = [{
    id: 'name',
    Header: 'Name',
    accessor: 'name'
  },
  {
    id: 'city',
    Header: 'City',
    accessor: 'city'

  },
  {
    id: 'phone',
    Header: 'Phone',
    accessor: 'phone'

  },
  {
    id: 'email',
    Header: 'Email',
    accessor: 'email'

  },
  {
    id: 'campaign',
    Header: 'Campaign',
    accessor: 'campaign'

  },];

  return (
    <div className='list-page'>

      {isVisibleMeetingDetail ? (
        <MeetingDetail isVisibleMeetingDetail={isVisibleMeetingDetail} setIsVisibleMeetingDetail={setIsVisibleMeetingDetail} />
      ) : isVisibleMeetingDetailPrevious ? (
        <MeetingDetailPrevious isVisibleMeetingDetailPrevious={isVisibleMeetingDetailPrevious} setIsVisibleMeetingDetailPrevious={setIsVisibleMeetingDetailPrevious} />
      ) : (
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
                      <button className='btn-profile-img'><img src={require("../../static/images/avatar-face.png")} alt="" /></button>
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
                      <h3>Upcoming Meetings </h3>
                      <div className='table'>
                        <ReactTable
                          width='100'
                          className='table responsive meetings-table'
                          minRows={6}
                          columns={columnsUpcomingMeetings}
                          filterable={false}
                          showPagination={false}
                          data={dataUpcomingMeetings}
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
          {/* Upcoming Meetings */}
          <div className='upcoming-meetings'>
            <div className='auto-container'>
              <div className='row'>
                <div className='col-12'>
                  <div className='upcoming-inner'>
                    <div className='upcoming-content'>
                      <h3>Previous Meetings</h3>
                      <div className='table'>
                        <ReactTable
                          width='100'
                          className='table responsive meetings-table'
                          minRows={6}
                          columns={columnsPreviousMeetings}
                          filterable={false}
                          showPagination={false}
                          data={dataPreviousMeetings}
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
      )}
    </div>
  );
}

export default ListMeetings;
