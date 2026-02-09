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
  const [searchTerm, setSearchTerm] = useState('');
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
      <div className="loading-container" style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        borderRadius: '16px',
        margin: '2rem auto',
        maxWidth: '1200px' 
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
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            background: 'linear-gradient(90deg, #556B2F, #8FA31E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Učitavanje ruta...
          </h2>
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

  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => 
    route.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (route.description && route.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>Moje rute</h1>
      </div>
      
      <div className="glass-card">
        <div className="header-with-button">
          <Link to="/new-route" className="btn-primary-modern" style={{ borderRadius: '8px' }}>
            + Dodaj novu rutu
          </Link>
        </div>

        {/* Search Input */}
        {routes.length > 0 && (
          <div style={{ marginBottom: '2rem', marginTop: '1.5rem' }}>
            <input
              type="text"
              placeholder="🔍 Pretraži svoje rute..."
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
        )}

        {routes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🗺️</div>
            <h3 className="text-white-modern" style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Nema ruta</h3>
            <p className="text-white-secondary" style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>Još uvek niste kreirali nijednu rutu.</p>
            <Link to="/new-route" className="btn-primary-modern" style={{ borderRadius: '8px' }}>
              Kreiraj prvu rutu
            </Link>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 2rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔍</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>
              Nema ruta koje odgovaraju pretrazi
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Pokušaj sa drugim terminom za pretragu
            </p>
          </div>
        ) : (
          <div className="routes-grid">
            {filteredRoutes.map((route, index) => (
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
                  </div>
                </div>
                <div className="route-card-footer" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/route/${route.id}`} className="btn-primary-modern" style={{ 
                    flex: 1, 
                    minWidth: '120px',
                    borderRadius: '8px'
                  }}>
                    Pogledaj detalje
                  </Link>
                  <button 
                    className="btn-secondary-modern"
                    onClick={() => handleEditRoute(route.id)}
                    style={{ 
                      flex: 1, 
                      minWidth: '80px',
                      borderRadius: '8px',
                      background: 'rgba(17, 153, 142, 0.8)',
                      borderColor: 'rgba(17, 153, 142, 0.9)',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
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
                      borderRadius: '8px',
                      background: deleting === route.id ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 107, 107, 0.3)',
                      borderColor: 'rgba(255, 107, 107, 0.5)',
                      color: 'rgba(255, 255, 255, 1)',
                      fontWeight: '600',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
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
          <div className="delete-modal-overlay" onClick={cancelDelete}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Potvrda brisanja</h3>
              <p>Da li ste sigurni da želite da obrišete rutu <strong>"{deleteConfirm.title}"</strong>?</p>
              <p className="delete-warning">Ova akcija se ne može poništiti.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  className="btn-secondary-modern"
                  onClick={cancelDelete}
                  style={{ borderRadius: '8px' }}
                >
                  Otkaži
                </button>
                <button 
                  className="btn-primary-modern"
                  onClick={() => handleDeleteRoute(deleteConfirm.id)}
                  disabled={deleting === deleteConfirm.id}
                  style={{ 
                    borderRadius: '8px',
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
