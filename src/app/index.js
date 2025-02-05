
import EventBus from "eventing-bus";
import Error from '@material-ui/icons/Error';
import React, { useEffect, Suspense, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import CheckCircle from '@material-ui/icons/CheckCircle';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Home from './Home/index';
import Talk from './Talk/index';
import ContactDetail from './ContactDetail/index';
import SplashScreen from './SplashScreen/index';
import Preloader from '../components/preloader';

import '../static/css/style.css';
import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import "react-toastify/dist/ReactToastify.css";


const App = () => {

  useEffect(() => {
    EventBus.on('info', (e) => toast.info(() => <div> <Error /> {e}</div>));
    EventBus.on('error', (e) => toast.error(() => <div> <Error /> {e}</div>));
    EventBus.on('success', (e) => toast.success(() => <div> <CheckCircle /> {e}</div>));
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate an API call
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div>
      <Suspense fallback={<SplashScreen />}>
        <ToastContainer closeOnClick position="bottom-left" />
        <Router>
          <Switch>
            {/* {showSplash && (<SplashScreen  />)} */}
            <Route exact path='/' component={props => <Home {...props} />} />
            <Route exact path='/Home' component={props => <Home {...props} />} />
            <Route exact path='/Talk' component={props => <Talk {...props} />} />
            <Route exact path='/ContactDetail' component={props => <ContactDetail {...props} />} />
          </Switch>
        </Router>
      </Suspense>
    </div>
  );
}

export default App;