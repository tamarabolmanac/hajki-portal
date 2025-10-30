import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/RouteDetails.css';
import { authenticatedFetch } from '../utils/api';
import { getCurrentUser, getCurrentUserID } from '../utils/authHandler';
import { config } from '../config';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import RouteTracker from './RouteTracker';

// Placeholder dok se mapa učitava
const MapPlaceholder = () => {
  return (
    <div className="map-placeholder">
      <p>Loading map...</p>
    </div>
  );
};

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const RouteDetails = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTracker, setShowTracker] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentUserID, setCurrentUserID] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  // Check if current user is the owner of the route
  const isRouteOwner = () => {
    if (!currentUserID || !route) return false;
    return String(currentUserID) === String(route.user_id);
  };

  // Load current user on component mount
  useEffect(() => {
    const userID = getCurrentUserID();
    setCurrentUserID(userID);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchRouteDetails = async () => {
      try {
        const data = await authenticatedFetch(`/routes/${id}`);
        setRoute(data.data);
        
        if (data.data.points && data.data.points.length > 0) {
          const points = data.data.points.map(point => ({
            lat: point.lat,
            lng: point.lng
          }));
          setRoutePoints(points);
          console.log('Loaded route points:', points);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteDetails();
  }, [id]);

  const isValidCoordinates = route &&
    !isNaN(route.location_latitude) &&
    !isNaN(route.location_longitude) &&
    Number(route.location_latitude) >= -90 &&
    Number(route.location_latitude) <= 90 &&
    Number(route.location_longitude) >= -180 &&
    Number(route.location_longitude) <= 180;

  if (error) {
    return (
      <div className="error-container">
        <h2>Greška</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !route) {
    return (
      <div className="loading-container" style={{ textAlign: "center" }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100px", height: "100px" }}
        >
          <source src="/animation/beaver.mp4" type="video/mp4" />
        </video>

        <p
          className="loading-text-modern"
          style={{ marginTop: "0.5rem", fontSize: "1.1rem", fontWeight: "500"}}
        >
          Učitavanje detalja rute...
        </p>
      </div>
    );
  }


  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: Number(route.location_latitude),
    lng: Number(route.location_longitude)
  };

  const handleStartTracking = () => {
    setShowTracker(true);
  };

  const handleStopTracking = () => {
    setShowTracker(false);
  };

  // If tracker is shown, render only the tracker
  if (showTracker) {
    return (
      <RouteTracker
        routeId={id}
        onTrackingStart={() => console.log('Tracking started for route:', id)}
        onTrackingStop={handleStopTracking}
      />
    );
  }

  return (
    <div className="route-details-container">
      <div className="route-header">
        <h1 className="route-title">{route.title}</h1>
        <div className="route-meta">
          <span className="route-duration">
            Duration: {formatDuration(route.duration)}
            {route.calculated_from_points && (
              <small style={{ color: '#28a745', marginLeft: '5px' }}>📍 GPS</small>
            )}
          </span>
          <span className="route-difficulty">Difficulty: {route.difficulty}</span>
          <span className="route-distance">
            Distance: {route.distance}km
            {route.calculated_from_points && (
              <small style={{ color: '#28a745', marginLeft: '5px' }}>📍 GPS</small>
            )}
          </span>
        </div>
        
        {/* Action Buttons - Only show for route owner */}
        {currentUserID && (
          <div className="route-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {isRouteOwner() ? (
              <>
                <button 
                  onClick={handleStartTracking}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  🗺️ Start Route Tracking
                </button>
                <button 
                  onClick={() => navigate(`/routes/${id}/edit`)}
                  style={{
                    background: 'linear-gradient(135deg, #2E7D32, #4CAF50)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ✏️ Edit Route
                </button>
              </>
            ) : (
              <div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="route-content">
        <div className="route-description">
          <h2>Description</h2>
          <p>{route.description}</p>
        </div>

        {route.image_urls && route.image_urls.length > 0 && (
          <div className="route-images">
            <h2>Slike</h2>
            <div className="image-gallery">
              {
                route.image_urls.map((imageUrl, index) => {
                  const filename = imageUrl.split('/').pop().split('?')[0];
                  const cdnUrl = `https://cdn.hajki.com/${filename}`;

                  return <img key={index} src={cdnUrl} alt={`Route image ${index + 1}`} />;
            
                })
              }
            </div>
          </div>
        )}

        <div className="route-map">
          <h3>Map</h3>
          {isValidCoordinates && config.googleMapsApiKey ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={routePoints.length > 0 ? routePoints[routePoints.length - 1] : center}
              zoom={routePoints.length > 0 ? 15 : 10}
            >
              {/* Osnovni marker za lokaciju rute */}
              <Marker position={center} />
              
              {/* Prikaz tracked route ako postoji */}
              {routePoints.length > 1 && (
                <Polyline
                  path={routePoints}
                  options={{
                    strokeColor: "#FF0000",
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                  }}
                />
              )}
              
              {/* Start i end markeri za tracked rutu */}
              {routePoints.length > 0 && (
                <>
                  <Marker
                    position={routePoints[0]}
                    icon={{
                      url: "data:image/svg+xml;charset=UTF-8," +
                        encodeURIComponent(`
                          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="8" fill="#00FF00" stroke="#FFFFFF" stroke-width="2"/>
                          </svg>
                        `),
                      scaledSize: { width: 20, height: 20 },
                    }}
                    title="Start Position"
                  />
                  <Marker
                    position={routePoints[routePoints.length - 1]}
                    icon={{
                      url: "data:image/svg+xml;charset=UTF-8," +
                        encodeURIComponent(`
                          <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="2"/>
                          </svg>
                        `),
                      scaledSize: { width: 20, height: 20 },
                    }}
                    title="End Position"
                  />
                </>
              )}
            </GoogleMap>
          ) : (
            <MapPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
};
