import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Navigation } from "./components/navigation";
import { HikeRoutes } from "./components/HikeRoutes";
import { RouteDetails } from "./components/RouteDetails";
import { EditRoute } from "./components/EditRoute";
import { ChoseRouteCreationType } from "./components/ChoseRouteCreationType";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { NewRoute } from "./components/NewRoute";
import { MyRoutes } from "./components/MyRoutes";
import { Contact } from "./components/contact";
import RouteTracker from "./components/RouteTracker";
import PrivateRoute from "./components/PrivateRoute"; 
import LoginPage from "./components/LoginPage";
import Register from "./components/Register";
import { Profile } from "./components/Profile";
import EmailConfirmation from "./components/EmailConfirmation";
import InstallPWA from "./components/InstallPWA";
import { setNavigate } from "./utils/authHandler";
import JsonData from "./data/data.json";
import { LoadScript } from '@react-google-maps/api';
import { REACT_APP_GOOGLE_MAPS_API_KEY } from './config';
import "./App.css";
import "./styles/main.css";
import { config } from './config';

// Wrapper component to access useNavigate
const AppContent = () => {
  const navigate = useNavigate();
  const [landingPageData, setLandingPageData] = useState({});

  useEffect(() => {
    setLandingPageData(JsonData);
    // Set navigate function for auth handler
    setNavigate(navigate);
  }, [navigate]);

  return (
    <LoadScript
      googleMapsApiKey={config.googleMapsApiKey}
      libraries={['places']}
      id="google-map-script"
    >
      <div>
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
                    <ChoseRouteCreationType />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/create-route-manual"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <NewRoute />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/track-new-route"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <RouteTracker 
                      routeId={null}
                      onTrackingStart={() => console.log('Started tracking new route')}
                      onTrackingStop={() => {
                        console.log('Stopped tracking new route');
                        // Navigate to my routes after tracking is complete
                        window.location.href = '/my_routes';
                      }}
                    />
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
            <Route
              path="/routes/:id/edit"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <EditRoute />
                  </div>
                </PrivateRoute>
              }
            />
            <Route path="/routes/:id" element={<RouteDetails />} />
            <Route path="/contact" element={
              <div className="content-container">
                <Contact />
              </div>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="/confirm/:token" element={<EmailConfirmation />} />
            <Route path="/confirm" element={<EmailConfirmation />} />
          </Routes>
        </div>
      </div>
    </LoadScript>
  );
};

// Main App component with Router wrapper
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
