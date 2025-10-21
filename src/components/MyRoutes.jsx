import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { config } from '../config';
import '../styles/MyRoutes.css';

export const MyRoutes = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const userIsAuthenticated = isAuthenticated();

  useEffect(() => {
    if (!userIsAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchMyRoutes = async () => {
      try {
        console.log('About to fetch my routes...'); // Debug log
        console.log('API URL:', config.apiUrl); // Debug log
        console.log('Full URL will be:', `${config.apiUrl}/my_routes`); // Debug log
        
        // This endpoint should return only routes created by the current user
        const data = await authenticatedFetch('/my_routes');
        console.log('My routes response:', data); // Debug log
        console.log('Routes data:', data.data); // Debug log
        console.log('Routes count:', data.data ? data.data.length : 0); // Debug log
        setRoutes(data.data || []);
      } catch (error) {
        console.error('Error fetching my routes:', error); // Debug log
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRoutes();
  }, [userIsAuthenticated]);

  const handleEditRoute = (routeId) => {
    navigate(`/routes/${routeId}/edit`);
  };

  const handleDeleteRoute = async (routeId) => {
    setDeleting(routeId);
    try {
      const response = await authenticatedFetch(`/routes/${routeId}`, {
        method: 'DELETE'
      });
      
      if (response.status === 200) {
        // Remove the deleted route from the state
        setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
        setDeleteConfirm(null);
      } else {
        setError(response.message || 'Greška pri brisanju rute');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      setError('Greška pri brisanju rute');
    } finally {
      setDeleting(null);
    }
  };

  const confirmDelete = (route) => {
    setDeleteConfirm(route);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (!userIsAuthenticated) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Moje rute</h1>
        </div>
        <div className="alert-info-modern">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>🔐 Potrebna prijava</h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Morate biti ulogovani da biste videli svoje rute.</p>
          <Link to="/login" className="btn-primary-modern">Uloguj se</Link>
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

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Moje rute</h1>
        </div>
        <div className="alert-error-modern">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>⚠️ Greška</h3>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Moje rute</h1>
      </div>
      
      <div className="glass-card">
        <div className="header-with-button">
          <Link to="/new-route" className="btn-primary-modern">
            + Dodaj novu rutu
          </Link>
        </div>

        {routes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🗺️</div>
            <h3 className="text-white-modern" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Nema ruta</h3>
            <p className="text-white-secondary" style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Još uvek niste kreirali nijednu rutu.</p>
            <Link to="/new-route" className="btn-primary-modern">
              Kreiraj prvu rutu
            </Link>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map((route, index) => (
              <div key={`${route.id}-${index}`} className="route-card">
                <div className="route-card-header">
                  <h3 className="route-title">{route.title}</h3>
                  <span className="route-difficulty">{route.difficulty}</span>
                </div>
                <div className="route-card-content">
                  <p className="route-description">{route.description}</p>
                  <div className="route-stats">
                    <span className="route-duration">
                      <i className="icon-time"></i>
                      {Math.floor(route.duration / 60)}h {route.duration % 60}m
                      {route.calculated_from_points && (
                        <small style={{ color: '#28a745', marginLeft: '5px' }}>📍</small>
                      )}
                    </span>
                    <span className="route-distance">
                      <i className="icon-distance"></i>
                      {route.distance}km
                      {route.calculated_from_points && (
                        <small style={{ color: '#28a745', marginLeft: '5px' }}>📍</small>
                      )}
                    </span>
                    {route.points_count > 0 && (
                      <span className="route-points">
                        <i className="icon-location"></i>
                        {route.points_count} GPS points
                      </span>
                    )}
                  </div>
                </div>
                <div className="route-card-footer" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/route/${route.id}`} className="btn-primary-modern" style={{ flex: 1, minWidth: '120px' }}>
                    Pogledaj detalje
                  </Link>
                  <button 
                    className="btn-secondary-modern"
                    onClick={() => handleEditRoute(route.id)}
                    style={{ flex: 1, minWidth: '80px' }}
                  >
                    Uredi
                  </button>
                  <button 
                    className="btn-secondary-modern"
                    onClick={() => confirmDelete(route)}
                    disabled={deleting === route.id}
                    style={{ 
                      flex: 1, 
                      minWidth: '80px',
                      background: deleting === route.id ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)',
                      borderColor: 'rgba(255, 107, 107, 0.3)',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {deleting === route.id ? 'Brisanje...' : 'Obriši'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="delete-modal-overlay">
            <div className="delete-modal">
              <h3>Potvrda brisanja</h3>
              <p>Da li ste sigurni da želite da obrišete rutu <strong>"{deleteConfirm.title}"</strong>?</p>
              <p className="delete-warning">Ova akcija se ne može poništiti.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  className="btn-secondary-modern"
                  onClick={cancelDelete}
                >
                  Otkaži
                </button>
                <button 
                  className="btn-primary-modern"
                  onClick={() => handleDeleteRoute(deleteConfirm.id)}
                  disabled={deleting === deleteConfirm.id}
                  style={{ 
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
                    boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  {deleting === deleteConfirm.id ? 'Brisanje...' : 'Obriši'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoutes;
