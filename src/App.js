import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Navigation } from "./components/navigation";
import { HikeRoutes } from "./components/HikeRoutes";
import { RouteDetails } from "./components/RouteDetails";
import { UserProfile } from "./components/UserProfile";
import { EditRoute } from "./components/EditRoute";
import { NearbyRoutes } from "./components/NearbyRoutes";
import { ChoseRouteCreationType } from "./components/ChoseRouteCreationType";
import { About } from "./components/about";
import { Guide } from "./components/Guide";
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
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Register from "./components/Register";
import "./styles/GlobalStyles.css";
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
import QuizLobby from "./components/QuizLobby";
import RouteRecommendation from "./components/RouteRecommendation";
import OsmRoutesMap from "./components/OsmRoutesMap";
import NatureMap from "./components/NatureMap";
import PrivacyPolicy from "./components/PrivacyPolicy";
import QuizRoom from "./components/QuizRoom";
import { authenticatedFetch } from "./utils/api";

// Wrapper component to access useNavigate
const AppContent = () => {
  const navigate = useNavigate();
  const [landingPageData, setLandingPageData] = useState({});

  useEffect(() => {
    setLandingPageData(JsonData);
    // Set navigate function for auth handler
    setNavigate(navigate);
  }, [navigate]);

  // Posebna stranica za snimanje postojeće rute po ID-ju
  const TrackRoutePage = () => {
    const { id } = useParams();
    const nav = useNavigate();

    const handleStop = useCallback(() => {
      nav(`/route/${id}`);
    }, [nav, id]);

    const onTrackingStart = useCallback(() => {
      console.log("Started tracking route", id);
    }, [id]);

    const trackingStartedKey = `tracking:route:${id}:started`;
    const shouldAutoStart = localStorage.getItem(trackingStartedKey) === "1";

    return (
      <div className="content-container track-route-page">
        <RouteTracker
          routeId={id}
          autoStart={shouldAutoStart}
          onTrackingStart={onTrackingStart}
          onTrackingStop={handleStop}
        />
      </div>
    );
  };

  return (
    <LoadScript
      googleMapsApiKey={config.googleMapsApiKey}
      libraries={['places']}
      id="google-map-script"
      loadingElement={
        <div className="routes-page">
          <div className="routes-background">
            <div className="routes-bg-image bg-image-loaded" style={{ background: 'radial-gradient(circle at 20% 20%, #8FA31E 0, transparent 55%), radial-gradient(circle at 80% 80%, #11998e 0, transparent 55%)' }} />
            <div className="routes-overlay" />
          </div>
          <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-container" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2.5rem 2rem', maxWidth: 420, textAlign: 'center', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 18px 45px rgba(0,0,0,0.45)' }}>
              <div className="loading-spinner-modern" />
              <h2 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', color: '#f7fafc', fontSize: '1.5rem', fontWeight: 700 }}>
                Učitavanje Hajki aplikacije
              </h2>
              <p style={{ margin: 0, color: 'rgba(226, 232, 240, 0.9)', fontSize: '0.95rem' }}>
                Pripremamo staze, planinare i mape za tvoju sledeću avanturu...
              </p>
            </div>
          </div>
        </div>
      }
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
            <Route path="/user/:id" element={
              <div className="content-container">
                <UserProfile />
              </div>
            } />
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
              path="/track-new-route/:id"
              element={
                <PrivateRoute>
                  <TrackRoutePage />
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
              path="/nearby"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <NearbyRoutes />
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/:roomId"
              element={
                <PrivateRoute>
                  <QuizRoom token={localStorage.getItem("authToken")} />
                </PrivateRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <div className="content-container">
                  <ForgotPassword />
                </div>
              }
            />
            <Route
              path="/reset-password"
              element={
                <div className="content-container">
                  <ResetPassword />
                </div>
              }
            />
            <Route
              path="/prirodnjacki-kviz"
              element={
                <PrivateRoute>
                  <div className="content-container">
                    <QuizLobby 
                      token={localStorage.getItem('authToken') || ''}
                      currentUserId={(() => {
                        const id1 = localStorage.getItem('userID');
                        if (id1) return Number(id1);
                        try {
                          const obj = JSON.parse(localStorage.getItem('user') || 'null');
                          if (obj?.id != null) return Number(obj.id);
                        } catch {}
                        try {
                          const det = JSON.parse(localStorage.getItem('userDetails') || 'null');
                          return det?.id != null ? Number(det.id) : null;
                        } catch {
                          return null;
                        }
                      })()}
                    />
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
            <Route path="/osm-mapa" element={<OsmRoutesMap />} />
            <Route path="/priroda" element={<NatureMap />} />
            <Route path="/preporuka" element={
              <PrivateRoute>
                <RouteRecommendation />
              </PrivateRoute>
            } />
            <Route path="/about" element={
              <div className="content-container">
                <About data={landingPageData.About} />
              </div>
            } />
            <Route path="/guide" element={
              <div className="content-container">
                <Guide />
              </div>
            } />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
