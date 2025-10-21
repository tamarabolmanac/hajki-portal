import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import { isAuthenticated } from '../utils/auth';
import '../styles/HikeRoutes.css'

export const HikeRoutes = (props) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      setUserIsAuthenticated(isAuthenticated());
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (login/logout events)
    const handleStorageChange = (e) => {
      if (e.key === 'authToken') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case token expires
    const authCheckInterval = setInterval(checkAuth, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, []);

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
      <div className="page-container">
        <div className="alert-error-modern">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>⚠️ Greška</h3>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="loading-spinner-modern" style={{ marginBottom: '1.5rem' }}></div>
          <p className="text-white-modern" style={{ fontSize: '1.1rem', fontWeight: '500' }}>Učitavanje ruta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Pretraži rute</h1>
      </div>
      
      <div className="glass-card">
        <div className="header-with-button">
          {userIsAuthenticated ? (
            <Link to="/new-route" className="btn-primary-modern">
              + Dodaj rutu
            </Link>
          ) : (
            <div className="auth-prompt">
              <Link to="/login" className="btn-secondary-modern">
                Uloguj se da dodaš rutu
              </Link>
            </div>
          )}
        </div>

        <div className="hike-cards-container">
          {data && data.map((hike, index) => (
            <div key={`${hike.title}-${index}`} className="hike-card">
              <div className="hike-card-content">
                <h3 className="hike-title">{hike.title}</h3>
                <p className="hike-description">{hike.description}</p>
                <div className="hike-details">
                  <span className="hike-duration">
                    Duration: {hike.duration}min
                    {hike.calculated_from_points && (
                      <small style={{ color: '#28a745', marginLeft: '5px' }}>📍</small>
                    )}
                  </span>
                  <span className="hike-difficulty">Difficulty: {hike.difficulty}</span>
                  {hike.distance && (
                    <span className="hike-distance">
                      Distance: {hike.distance}km
                      {hike.calculated_from_points && (
                        <small style={{ color: '#28a745', marginLeft: '5px' }}>📍</small>
                      )}
                    </span>
                  )}
                  {hike.points_count > 0 && (
                    <span className="hike-points">
                      {hike.points_count} GPS points
                    </span>
                  )}
                </div>
              </div>
              <div className="hike-card-footer">
                <Link to={`/route/${hike.id}`} className="btn-primary-modern">
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
