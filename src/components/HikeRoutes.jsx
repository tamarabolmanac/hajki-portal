import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import { isAuthenticated } from '../utils/auth';
import '../styles/HikeRoutes.css'

export const HikeRoutes = (props) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userIsAuthenticated = isAuthenticated();

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        // Fetch all routes - no authentication required for viewing
        const response = await fetch(`${config.apiUrl}/routes`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch routes');
        }
        
        setData(data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <h2>Greška</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <h2>Učitavanje...</h2>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="container">
        <div className="header-with-button">
          <h2 className="page-title">Pretraži rute</h2>
          {userIsAuthenticated && (
            <Link to="/new-route" className="add-route-button">
              + Dodaj rutu
            </Link>
          )}
        </div>

        <div className="hike-cards-container">
          {data && data.map((hike, index) => (
            <div key={`${hike.title}-${index}`} className="hike-card">
              <div className="hike-card-content">
                <h3 className="hike-title">{hike.title}</h3>
                <p className="hike-description">{hike.description}</p>
                <div className="hike-details">
                  <span className="hike-duration">Duration: {hike.duration}h</span>
                  <span className="hike-difficulty">Difficulty: {hike.difficulty}</span>
                </div>
              </div>
              <div className="hike-card-footer">
                <Link to={`/route/${hike.id}`} className="view-route-btn">
                  Pogledaj detalje
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
