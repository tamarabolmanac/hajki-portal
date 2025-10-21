import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import '../styles/NearbyRoutes.css';

// Dynamic imports for Capacitor (only available in mobile build)
let Geolocation = null;
let Capacitor = null;
let App = null;

try {
  // Try to import Capacitor modules (will fail in web build)
  const capacitorCore = require('@capacitor/core');
  const capacitorGeolocation = require('@capacitor/geolocation');
  const capacitorApp = require('@capacitor/app');
  Capacitor = capacitorCore.Capacitor;
  Geolocation = capacitorGeolocation.Geolocation;
  App = capacitorApp.App;
} catch (error) {
  // Capacitor not available (web build)
  console.log('Running in web mode - Capacitor not available');
}

export const NearbyRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [radius, setRadius] = useState(10); // km radius
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Get user's current location - Universal (web + mobile)
  useEffect(() => {
    const getCurrentLocation = async () => {
      setLoading(true);
      
      try {
        // Check if Capacitor is available and we're on native platform
        if (Capacitor && Geolocation && Capacitor.isNativePlatform()) {
          console.log('Using Capacitor geolocation (native app)');
          
          // Request permissions first on native
          const permissions = await Geolocation.requestPermissions();
          
          if (permissions.location === 'granted') {
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000 // 5 minutes
            });
            
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(location);
            setLocationError(null);
          } else {
            setLocationError('Potrebna je dozvola za pristup lokaciji. Molimo omogućite u podešavanjima aplikacije.');
            setLoading(false);
          }
        } else {
          // Web fallback or Capacitor not available
          console.log('Using web geolocation API');
          
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
        }
      } catch (error) {
        console.error('Geolocation error:', error);
        setLocationError('Greška pri dobijanju lokacije. Molimo pokušajte ponovo.');
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  // Background location tracking
  const startBackgroundTracking = async () => {
    if (!Capacitor || !Geolocation || !Capacitor.isNativePlatform()) {
      console.log('Background tracking not available on web');
      return;
    }

    try {
      // Request background location permission
      const permissions = await Geolocation.requestPermissions();
      
      if (permissions.location !== 'granted') {
        setLocationError('Potrebna je dozvola za pristup lokaciji u pozadini.');
        return;
      }

      // Start watching position with background options
      const id = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000 // 1 minute
      }, (position) => {
        console.log('Background location update:', position);
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        
        // Save location to local storage for persistence
        localStorage.setItem('lastKnownLocation', JSON.stringify({
          ...location,
          timestamp: Date.now()
        }));
      }, (error) => {
        console.error('Background location error:', error);
      });

      setWatchId(id);
      setBackgroundTracking(true);
      console.log('Background location tracking started');
      
    } catch (error) {
      console.error('Failed to start background tracking:', error);
      setLocationError('Greška pri pokretanju praćenja lokacije u pozadini.');
    }
  };

  const stopBackgroundTracking = async () => {
    if (watchId && Geolocation) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
      setBackgroundTracking(false);
      console.log('Background location tracking stopped');
    }
  };

  // App lifecycle management
  useEffect(() => {
    if (!App || !Capacitor?.isNativePlatform()) return;

    const handleAppStateChange = (state) => {
      console.log('App state changed:', state);
      
      if (state.isActive) {
        // App came to foreground
        console.log('App is now active');
        
        // Load last known location from storage
        const lastLocation = localStorage.getItem('lastKnownLocation');
        if (lastLocation) {
          const parsedLocation = JSON.parse(lastLocation);
          // Only use if less than 10 minutes old
          if (Date.now() - parsedLocation.timestamp < 600000) {
            setUserLocation({
              lat: parsedLocation.lat,
              lng: parsedLocation.lng
            });
          }
        }
      } else {
        // App went to background
        console.log('App is now in background');
      }
    };

    App.addListener('appStateChange', handleAppStateChange);

    return () => {
      App.removeAllListeners();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId && Geolocation) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

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

  const retryLocation = async () => {
    setLocationError(null);
    setLoading(true);
    
    try {
      if (Capacitor && Geolocation && Capacitor.isNativePlatform()) {
        // On Android, try to get location again
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000 // 1 minute for retry
        });
        
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        setLocationError(null);
      } else {
        // Web retry - reload page
        window.location.reload();
      }
    } catch (error) {
      console.error('Retry location error:', error);
      setLocationError('I dalje nije moguće dobiti lokaciju. Proverite da li je GPS uključen.');
      setLoading(false);
    }
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
            {(Capacitor && Capacitor.isNativePlatform()) ? 'Pokušaj ponovo' : 'Osvežite stranicu'}
          </button>
          
          {(Capacitor && Capacitor.isNativePlatform()) && (
            <div className="android-help">
              <p><strong>Android korisnici:</strong></p>
              <p>• Proverite da li je GPS uključen</p>
              <p>• Idite u Podešavanja → Aplikacije → Hajki → Dozvole</p>
              <p>• Omogućite "Lokacija" dozvolu</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="nearby-routes-container">
        <div className="nearby-routes-header">
          <h1>Blizu mene</h1>
          <p>Pronađite rute u vašoj blizini</p>
        </div>
        
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Pronalaženje vaše lokacije...</p>
        </div>
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

        {/* Background tracking controls - only show on mobile */}
        {(Capacitor && Capacitor.isNativePlatform()) && (
          <div className="background-tracking-section">
            <div className="tracking-control">
              <label>Praćenje lokacije u pozadini:</label>
              <div className="tracking-buttons">
                {!backgroundTracking ? (
                  <button
                    className="tracking-btn start-tracking"
                    onClick={startBackgroundTracking}
                  >
                    🔄 Pokreni praćenje
                  </button>
                ) : (
                  <button
                    className="tracking-btn stop-tracking"
                    onClick={stopBackgroundTracking}
                  >
                    ⏹️ Zaustavi praćenje
                  </button>
                )}
              </div>
              {backgroundTracking && (
                <div className="tracking-status">
                  <span className="status-indicator">🟢</span>
                  <span>Lokacija se prati u pozadini</span>
                </div>
              )}
            </div>
            
            <div className="tracking-info">
              <p><strong>Napomena:</strong></p>
              <p>• Praćenje u pozadini omogućava ažuriranje lokacije kada app nije aktivan</p>
              <p>• Potrebno je dozvoliti "Uvek" za lokaciju u podešavanjima</p>
              <p>• Može uticati na bateriju</p>
            </div>
          </div>
        )}
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
                      
                      {route.points_count > 0 && (
                        <div className="stat">
                          <span className="stat-icon">📍</span>
                          <span>{route.points_count} GPS points</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="route-card-footer">
                    <Link to={`/route/${route.id}`} className="view-route-btn">
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
