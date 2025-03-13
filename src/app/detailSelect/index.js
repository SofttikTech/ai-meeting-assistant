import Select from '@mui/material/Select';
import { useHistory } from 'react-router-dom';
import MenuItem from '@mui/material/MenuItem';
import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import FormControl from '@mui/material/FormControl';


import './index.css';

function DetailSelect() {
  const history = useHistory();
  const [clientBuy, setClientBuy] = useState('');
  const [whatCompany, setWhatCompany] = useState('');
  const [presentSage, setPresentSage] = useState('');
  const [productType, setProductType] = useState('');
  const [anyReferrals, setAnyReferrals] = useState('');
  const [annualPremium, setAnnualPremium] = useState('');
  const [clientPurchase, setClientPurchase] = useState('');

  const handleListMeetings = () => {
    history.push('/list-meetings');

  };

  const handleClientBuy = (event) => {
    setClientBuy(event.target.value);
  };
  const handleWhatCompany = (event) => {
    setWhatCompany(event.target.value);
  };
  const handlePresentSage = (event) => {
    setPresentSage(event.target.value);
  };
  const handleClientPurchase = (event) => {
    setClientPurchase(event.target.value);
  };
  const handleAnnualPremium = (event) => {
    setAnnualPremium(event.target.value);
  };
  const handleProductType = (event) => {
    setProductType(event.target.value);
  };
  const handleAnyReferrals = (event) => {
    setAnyReferrals(event.target.value);
  };

  return (
    <div className='list-page'>
      <div className='list-page-inner'>
        <div className='top-nav-area'>
          <div className='auto-container'>
            <div className='row'>
              <div className='col-12'>
                <div className='nav-area-inner'>
                  <div className='left-logo-area'>
                    <button className="btn-style-new" onClick={handleListMeetings}>
                      <svg
                        width="24"
                        height="25"
                        viewBox="0 0 24 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.57895 7.5V12.5L0 6.25L7.57895 0V5H13.8947C16.5748 5 19.1451 6.05357 21.0402 7.92893C22.9353 9.8043 24 12.3478 24 15C24 17.6522 22.9353 20.1957 21.0402 22.0711C19.1451 23.9464 16.5748 25 13.8947 25H2.52632V22.5H13.8947C15.9048 22.5 17.8325 21.7098 19.2539 20.3033C20.6752 18.8968 21.4737 16.9891 21.4737 15C21.4737 13.0109 20.6752 11.1032 19.2539 9.6967C17.8325 8.29018 15.9048 7.5 13.8947 7.5H7.57895Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='selection-area'>
          <div className="auto-container">
            <div className='row'>
              <div className='col-lg-4 col-md-6 col-sm-12'>
                <div className='selection-detail-box'>
                  <div className='select-box'>
                    <FormControl sx={{ m: 1, minWidth: 120 }}>
                      <Select
                        value={clientBuy}
                        onChange={handleClientBuy}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        MenuProps={{
                          PaperProps: {
                            className: "select-panel-dropdown",
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Did you ask the client to buy?</em>
                        </MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div className='select-box'>
                    <div className='froup-form'>
                      <label>What Company?</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        placeholder='What Company?'
                        size="small"
                        value="softtik technologes"
                        // onChange={handleEditChange}
                        name='type'
                      />
                    </div>
                  </div>
                  <div className='select-box'>
                    <FormControl sx={{ m: 1, minWidth: 120 }}>
                      <Select
                        value={presentSage}
                        onChange={handlePresentSage}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        MenuProps={{
                          PaperProps: {
                            className: "select-panel-dropdown",
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Did you present Sage?</em>
                        </MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </div>
              <div className='col-lg-4 col-md-6 col-sm-12'>
                <div className='selection-detail-box'>
                  <div className='select-box'>
                    <FormControl sx={{ m: 1, minWidth: 120 }}>
                      <Select
                        value={clientPurchase}
                        onChange={handleClientPurchase}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        MenuProps={{
                          PaperProps: {
                            className: "select-panel-dropdown",
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Did the client purchase?</em>
                        </MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div className='select-box'>
                  <div className='froup-form'>
                      <label>What was the annual premium?</label>
                      <TextField
                        hiddenLabel
                        variant="standard"
                        placeholder='What was the annual premium?'
                        size="small"
                        value="5164 $"
                        // onChange={handleEditChange}
                        name='type'
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className='col-lg-4 col-md-6 col-sm-12'>
                <div className='selection-detail-box'>
                  <div className='select-box'>
                    <FormControl sx={{ m: 1, minWidth: 120 }}>
                      <Select
                        value={productType}
                        onChange={handleProductType}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        MenuProps={{
                          PaperProps: {
                            className: "select-panel-dropdown style-two",
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>If purchased what product type?</em>
                        </MenuItem>
                        <MenuItem value="Medicare Supplement">Medicare Supplement</MenuItem>
                        <MenuItem value="Medicare Advantage">Medicare Advantage</MenuItem>
                        <MenuItem value="Ancillary">Ancillary</MenuItem>
                        <MenuItem value="Long Term Care / Hybrid">Long Term Care / Hybrid</MenuItem>
                        <MenuItem value="Whole Life">Whole Life</MenuItem>
                        <MenuItem value="Term">Term</MenuItem>
                        <MenuItem value="IUL/ GUL">IUL/ GUL</MenuItem>
                        <MenuItem value="Annuity">Annuity</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                  <div className='select-box'>
                    <FormControl sx={{ m: 1, minWidth: 120 }}>
                      <Select
                        value={anyReferrals}
                        onChange={handleAnyReferrals}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Without label' }}
                        MenuProps={{
                          PaperProps: {
                            className: "select-panel-dropdown",
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>Did you receive any referrals?</em>
                        </MenuItem>
                        <MenuItem value="yes">Yes</MenuItem>
                        <MenuItem value="no">No</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </div>
              <div className='col-12'>
                <div className='btn-area text-center mt-4'>
                  <button className='btn-style-new'>Submit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailSelect;