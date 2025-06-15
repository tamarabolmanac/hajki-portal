import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/RouteDetails.css';
import { config } from '../config';
import { GoogleMap, Marker } from '@react-google-maps/api';

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
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:3000/routes/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setRoute(data.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
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
      <div className="loading-container">
        <h2>Učitavanje...</h2>
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

  return (
    <div className="route-details-container">
      <div className="route-header">
        <h1 className="route-title">{route.title}</h1>
        <div className="route-meta">
          <span className="route-duration">Duration: {formatDuration(route.duration)}</span>
          <span className="route-difficulty">Difficulty: {route.difficulty}</span>
          <span className="route-distance">Distance: {route.distance}km</span>
        </div>
      </div>

      <div className="route-content">
        <div className="route-description">
          <h2>Description</h2>
          <p>{route.description}</p>
        </div>

        <div className="route-map">
          <h3>Map</h3>
          {isValidCoordinates && config.googleMapsApiKey ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={10}
            >
              <Marker position={center} />
            </GoogleMap>
          ) : (
            <MapPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
};
