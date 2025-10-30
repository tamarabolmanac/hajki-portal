import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import '../styles/NearbyRoutes.css';

export const NearbyRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [radius, setRadius] = useState(10); // km radius

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = () => {
      setLoading(true);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(location);
            setLocationError(null);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Nije moguće dobiti vašu lokaciju. Molimo dozvolite pristup lokaciji.');
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        setLocationError('Vaš browser ne podržava geolokaciju.');
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);


  // Fetch nearby routes when user location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyRoutes();
    }
  }, [userLocation, radius]);

  const fetchNearbyRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authenticatedFetch(
        `/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
      );
      
      if (response && response.data) {
        setRoutes(response.data);
      }
    } catch (err) {
      setError('Greška pri učitavanju ruta u blizini.');
      console.error('Error fetching nearby routes:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
  };

  const retryLocation = () => {
    window.location.reload();
  };

  if (locationError) {
    return (
      <div className="nearby-routes-container">
        <div className="nearby-routes-header">
          <h1>Blizu mene</h1>
          <p>Pronađite rute u vašoj blizini</p>
        </div>
        
        <div className="location-error">
          <div className="error-icon">📍</div>
          <h3>Potreban je pristup lokaciji</h3>
          <p>{locationError}</p>
          <button 
            className="retry-location-btn"
            onClick={retryLocation}
          >
            Osvežite stranicu
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
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
          style={{
            marginTop: "0.6rem",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}
        >
          Učitavanje...
        </p>
      </div>
    );
}


  return (
    <div className="nearby-routes-container">
      <div className="nearby-routes-header">
        <h1>Blizu mene</h1>
        <p>Rute u blizini vaše trenutne lokacije</p>
        
        {userLocation && (
          <div className="location-info">
            <span className="location-icon">📍</span>
            <span>Vaša lokacija: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
          </div>
        )}
      </div>

      <div className="filters-section">
        <div className="radius-filter">
          <label>Radius pretrage:</label>
          <div className="radius-buttons">
            {[5, 10, 20, 50].map(r => (
              <button
                key={r}
                className={`radius-btn ${radius === r ? 'active' : ''}`}
                onClick={() => handleRadiusChange(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="routes-section">
        {routes.length === 0 ? (
          <div className="no-routes">
            <div className="no-routes-icon">🗺️</div>
            <h3>Nema ruta u blizini</h3>
            <p>Nema dostupnih ruta u radijusu od {radius} km od vaše lokacije.</p>
            <p>Pokušajte sa većim radijusom pretrage.</p>
            <div className="debug-info" style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.9rem' }}>
              <strong>Debug info:</strong><br/>
              Vaša lokacija: {userLocation?.lat.toFixed(6)}, {userLocation?.lng.toFixed(6)}<br/>
              Radius: {radius} km<br/>
              <em>Proverite browser console za više detalja</em>
            </div>
          </div>
        ) : (
          <>
            <div className="routes-count">
              Pronađeno {routes.length} ruta u radijusu od {radius} km
            </div>
            
            <div className="routes-grid">
              {routes.map((route) => (
                <div key={route.id} className="route-card">
                  <div className="route-card-header">
                    <h3 className="route-title">{route.title}</h3>
                  </div>
                  
                  <div className="route-card-content">
                    <p className="route-description">{route.description}</p>
                    
                    <div className="route-stats">
                      <div className="stat">
                        <span className="stat-icon">⏱️</span>
                        <span>{route.duration} min</span>
                        {route.calculated_from_points && (
                          <small className="gps-indicator">📍</small>
                        )}
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">📏</span>
                        <span>{route.distance} km</span>
                        {route.calculated_from_points && (
                          <small className="gps-indicator">📍</small>
                        )}
                      </div>
                      
                      <div className="stat">
                        <span className="stat-icon">⛰️</span>
                        <span>{route.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="route-card-footer">
                    <Link to={`/route/${route.id}`} className="btn-primary-modern" style={{ borderRadius: '8px' }}>
                      Pogledaj detalje
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
