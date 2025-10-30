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
  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="loading-container">
      <div
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "120px", height: "120px", marginBottom: "1.2rem" }}
        >
          <source src="/animation/beaver.mp4" type="video/mp4" />
        </video>

        <p
          className="text-black-modern"
          style={{ fontSize: "1.2rem", fontWeight: "500", marginBottom: "0.3rem" }}
        >
          Učitavanje ruta...
        </p>
      </div>
    </div>
  );
}


  // Filter routes based on search term
  const filteredRoutes = data ? data.filter(route => 
    route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Pretraži rute</h1>
      </div>
      
      <div className="glass-card">
        <div className="header-with-button">
          {userIsAuthenticated ? (
            <Link to="/new-route" className="btn-primary-modern" style={{ borderRadius: '8px' }}>
              + Dodaj rutu
            </Link>
          ) : (
            <div className="auth-prompt">
              <Link to="/login" className="btn-secondary-modern" style={{ borderRadius: '8px' }}>
                Uloguj se da dodaš rutu
              </Link>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="🔍 Pretraži rute po nazivu ili opisu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input-modern"
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              transition: 'all 0.3s ease'
            }}
          />
          {searchTerm && (
            <p style={{ marginTop: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Pronađeno ruta: {filteredRoutes.length}
            </p>
          )}
        </div>

        <div className="hike-cards-container">
          {filteredRoutes && filteredRoutes.length > 0 ? (
            filteredRoutes.map((hike, index) => (
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
                </div>
              </div>
              <div className="hike-card-footer">
                <Link to={`/route/${hike.id}`} className="btn-primary-modern" style={{ borderRadius: '8px' }}>
                  Pogledaj detalje
                </Link>
              </div>
            </div>
          ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔍</p>
              <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                {searchTerm ? 'Nema ruta koje odgovaraju pretrazi' : 'Nema dostupnih ruta'}
              </p>
              {searchTerm && (
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Pokušaj sa drugim terminom za pretragu
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
