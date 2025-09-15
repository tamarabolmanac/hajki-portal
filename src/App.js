import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from "./components/navigation";
import { HikeRoutes } from "./components/HikeRoutes";
import { RouteDetails } from "./components/RouteDetails";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { NewRoute } from "./components/NewRoute";
import { MyRoutes } from "./components/MyRoutes";
import { Contact } from "./components/contact";
import PrivateRoute from "./components/PrivateRoute"; 
import LoginPage from "./components/LoginPage";
import Register from "./components/Register";
import { Profile } from "./components/Profile";
import JsonData from "./data/data.json";
import { LoadScript } from '@react-google-maps/api';
import { REACT_APP_GOOGLE_MAPS_API_KEY } from './config';
import "./App.css";
import "./styles/main.css";
import { config } from './config';

const App = () => {
  const [landingPageData, setLandingPageData] = useState({});

  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <LoadScript
      googleMapsApiKey={config.googleMapsApiKey}
      libraries={['places']}
      id="google-map-script"
    >
      <Router>
        <Navigation />
        <div className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <div className="content-container">
                    <About data={landingPageData.About} />
                    {/*
                    <HikeRoutes data={landingPageData.HikeRoutes} />
                    <Services data={landingPageData.Services} />
                    <Gallery data={landingPageData.Gallery} />
                    <Testimonials data={landingPageData.Testimonials} />
                    <Team data={landingPageData.Team} />
                    <Contact data={landingPageData.Contact} />
                    */}
                  </div>
                </>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <Profile />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <HikeRoutes />
                  </div>
                </PrivateRoute>
              }
            />
            <Route 
              path="/route/:id"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <RouteDetails />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/new-route"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <NewRoute />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/my_routes"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <MyRoutes />
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    </LoadScript>
  );
};

export default App;
