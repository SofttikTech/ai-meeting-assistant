import EventBus from "eventing-bus";
import { ToastContainer, toast } from 'react-toastify';
import { Error, CheckCircle } from '@material-ui/icons';
import React, { useEffect, Suspense, useState, createContext } from 'react';
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";

import Talk from './Talk/index';
import Login from './Login/index';
import SplashScreen from './SplashScreen/index';
import AddUser from './AddUser/index';
import CallingAnimation from './Talk/callingAnimation';

import '../static/css/style.css';
import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import "react-toastify/dist/ReactToastify.css";

export const DataContext = createContext();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [agent, setAgent] = useState({ name: "", image: "" });

  useEffect(() => {
    const infoListener = EventBus.on('info', (e) => toast.info(<div><Error /> {e}</div>));
    const errorListener = EventBus.on('error', (e) => toast.error(<div><Error /> {e}</div>));
    const successListener = EventBus.on('success', (e) => toast.success(<div><CheckCircle /> {e}</div>));

    // Cleanup EventBus listeners
    return () => {
      infoListener();
      errorListener();
      successListener();
    };
  }, []);

  useEffect(() => {
    const name = localStorage.getItem("name");
    const image = localStorage.getItem("image");

    if (name && image) {
      setAgent({ name, image });
    }
  }, []);

  useEffect(() => {
    if (agent.name && agent.image) {
      localStorage.setItem("name", agent.name);
      localStorage.setItem("image", agent.image);
    }
  }, [agent]);

  return (
    <div>
      <Suspense fallback={<SplashScreen />}>
        <ToastContainer closeOnClick position="bottom-left" />
        <DataContext.Provider value={{ agent, setAgent }}>
          <Router>
            <RoutesWithLoader />
          </Router>
        </DataContext.Provider>
      </Suspense>
    </div>
  );
};

// Routes and Loader Component
const RoutesWithLoader = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 3000); // Simulate 2-second delay
    return () => clearTimeout(timer); // Cleanup timer
  }, [location.pathname]);

  // Render specific loaders based on route
  // if (isLoading) {
  //   if (location.pathname === "/Talk") {
  //     return <CallingAnimation />;
  //   }
  //   return <SplashScreen />;
  // }

  return (
    <Switch>
      <Route exact path="/" component={Login} />
      <Route exact path="/Login" component={Login} />
      <Route exact path="/Talk" component={Talk} />
      <Route exact path="/AddUser" component={AddUser} />
    </Switch>
  );
};

export default App;
