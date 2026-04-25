import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { authenticatedFetch } from '../utils/api';
import { BackgroundImage } from './BackgroundImage';
import '../styles/NearbyRoutes.css';
import '../styles/RoutesList.css';

export const NearbyRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [radius, setRadius] = useState(10); // km radius
  const [nearbyMode, setNearbyMode] = useState('hiking_paths');
  const [peaks, setPeaks] = useState([]);
  const [selectedPeak, setSelectedPeak] = useState(null);

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
    if (!userLocation) return;
    if (nearbyMode === 'hiking_paths') {
      fetchNearbyRoutes();
      return;
    }
    fetchNearbyPeaks();
  }, [userLocation, radius, nearbyMode]);

  const fetchNearbyRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedPeak(null);
      setPeaks([]);
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

  const fetchNearbyPeaks = async () => {
    try {
      setLoading(true);
      setError(null);
      setRoutes([]);
      setSelectedPeak(null);

      const response = await authenticatedFetch('/nearby/overpass', {
        method: 'POST',
        body: JSON.stringify({
          lat: userLocation.lat,
          lon: userLocation.lng,
          radius,
          mode: 'peaks',
          country: 'Serbia',
        }),
      });

      console.log('[Nearby/Planinski vrhovi] Overpass response:', response);
      const elements = response?.data?.elements || [];
      const parsedPeaks = elements
        .filter((el) => el?.type === 'node' && typeof el?.lat === 'number' && typeof el?.lon === 'number')
        .map((el) => ({
          id: el.id,
          lat: el.lat,
          lng: el.lon,
          name: el?.tags?.name || el?.tags?.["name:sr"] || el?.tags?.int_name || "Planinski vrh",
          elevation: el?.tags?.ele || null,
        }));
      setPeaks(parsedPeaks);
    } catch (err) {
      setError('Greška pri učitavanju planinskih vrhova u blizini.');
      console.error('Error fetching nearby peaks:', err);
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
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
          <div className="routes-overlay" />
        </div>
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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
          <div className="routes-overlay" />
        </div>
      <div className="nearby-routes-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-container" style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        margin: '2rem auto',
        maxWidth: '1200px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            position: 'relative',
            width: '150px',
            height: '150px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
                transform: 'scale(1)',
                outline: 'none',
                border: 'none',
                boxShadow: 'none'
              }}
            >
              <source src="/animation/beaver.mp4" type="video/mp4" />
            </video>
          </div>

          <h2 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            background: 'linear-gradient(90deg, #556B2F, #8FA31E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Učitavanje...
          </h2>
        </div>
      </div>
      </div>
      </div>
    );
}


  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>
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
        <div className="radius-filter" style={{ marginBottom: '0.75rem' }}>
          <label>Šta želite da pretražite:</label>
          <div className="radius-buttons">
            <button
              className={`radius-btn ${nearbyMode === 'peaks' ? 'active' : ''}`}
              onClick={() => setNearbyMode('peaks')}
            >
              Planinski vrhovi
            </button>
            <button
              className={`radius-btn ${nearbyMode === 'hiking_paths' ? 'active' : ''}`}
              onClick={() => setNearbyMode('hiking_paths')}
            >
              Pešačke staze
            </button>
          </div>
        </div>

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
        {nearbyMode === 'peaks' ? (
          <>
            <div className="routes-count">
              Pronađeno {peaks.length} planinskih vrhova u radijusu od {radius} km
            </div>
            <div className="nearby-peaks-map-wrapper">
              <GoogleMap
                mapContainerClassName="nearby-peaks-map"
                center={selectedPeak ? { lat: selectedPeak.lat, lng: selectedPeak.lng } : userLocation}
                zoom={11}
              >
                {peaks.map((peak) => (
                  <Marker
                    key={peak.id}
                    position={{ lat: peak.lat, lng: peak.lng }}
                    onClick={() => setSelectedPeak(peak)}
                  />
                ))}
                {selectedPeak && (
                  <InfoWindow
                    position={{ lat: selectedPeak.lat, lng: selectedPeak.lng }}
                    onCloseClick={() => setSelectedPeak(null)}
                  >
                    <div className="peak-info-window">
                      <strong>{selectedPeak.name}</strong>
                      {selectedPeak.elevation && <div>Nadmorska visina: {selectedPeak.elevation} m</div>}
                      <div>
                        {selectedPeak.lat.toFixed(5)}, {selectedPeak.lng.toFixed(5)}
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </>
        ) : routes.length === 0 ? (
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
    </div>
  );
};
