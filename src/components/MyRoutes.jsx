import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { config } from '../config';
import '../styles/MyRoutes.css';

export const MyRoutes = () => {
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
      <div className="my-routes-container">
        <div className="container">
          <h2 className="page-title">Moje rute</h2>
          <div className="auth-message">
            <p>Morate biti ulogovani da biste videli svoje rute.</p>
            <Link to="/login" className="login-link">Prijavite se</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-routes-container">
        <div className="container">
          <h2 className="page-title">Moje rute</h2>
          <div className="loading-container">
            <p>Učitavanje...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-routes-container">
        <div className="container">
          <h2 className="page-title">Moje rute</h2>
          <div className="error-container">
            <h3>Greška</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-routes-container">
      <div className="container">
        <div className="header-with-button">
          <h2 className="page-title">Moje rute</h2>
          <Link to="/new-route" className="add-route-button">
            + Dodaj novu rutu
          </Link>
        </div>

        {routes.length === 0 ? (
          <div className="no-routes">
            <p>Još uvek niste kreirali nijednu rutu.</p>
            <Link to="/new-route" className="create-first-route-btn">
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
                    </span>
                    <span className="route-distance">
                      <i className="icon-distance"></i>
                      {route.distance}km
                    </span>
                  </div>
                </div>
                <div className="route-card-footer">
                  <Link to={`/route/${route.id}`} className="view-route-btn">
                    Pogledaj detalje
                  </Link>
                  <button className="edit-route-btn">
                    Uredi
                  </button>
                  <button 
                    className="delete-route-btn"
                    onClick={() => confirmDelete(route)}
                    disabled={deleting === route.id}
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
              <div className="delete-modal-buttons">
                <button 
                  className="cancel-delete-btn"
                  onClick={cancelDelete}
                >
                  Otkaži
                </button>
                <button 
                  className="confirm-delete-btn"
                  onClick={() => handleDeleteRoute(deleteConfirm.id)}
                  disabled={deleting === deleteConfirm.id}
                >
                  {deleting === deleteConfirm.id ? 'Brisanje...' : 'Obriši rutu'}
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
