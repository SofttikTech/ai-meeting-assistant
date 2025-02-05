import { connect } from 'react-redux';
import React, { Component } from 'react';

import './index.css';

class Preloader extends Component {

  render() {
    return (
      <div className="remote-job-loader">
        <div className="preloader">
          <div class="ring">
            <div className='img-box'>
              {/* <img src={require('../../static/images/logo-loader.png')} alt='' /> */}
            </div>
            <span></span>
          </div>
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = {};

const mapStateToProps = ({ Auth }) => {
  let { } = Auth;
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(Preloader);
