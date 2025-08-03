import React, { useState, useEffect } from 'react';
import { config } from '../config';

// Check if we have a valid API key
const isValidApiKey = config.googleMapsApiKey && config.googleMapsApiKey.length > 0;

const containerStyle = {
  width: '100%',
  height: '400px'
};

const LocationTracker = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => setError(err.message)
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  }, []);

  if (error || mapError) {
    return (
      <div className="location-error">
        <h3>Greška:</h3>
        <p>{error || mapError}</p>
      </div>
    );
  }

  if (!isValidApiKey) {
    return (
      <div className="location-error">
        <h3>Greška:</h3>
        <p>Nije postavljen Google Maps API ključ</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="location-error">
        <h3>Greška:</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="location-tracker-container">
      <div id="map-container" style={{ width: '100%', height: '400px' }}>
        <iframe
          width="100%"
          height="100%"
          src={`https://maps.google.com/maps?q=${currentLocation?.lat},${currentLocation?.lng}&z=15&output=embed`}
          title="Google Maps"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="location-info">
        {currentLocation && (
          <>
            <p>Trenutna lokacija:</p>
            <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
            <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;
