import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { BackgroundImage } from './BackgroundImage';
import AppLoader from './AppLoader';
import '../styles/HikeRoutes.css';
import '../styles/RoutesList.css';

/** Optimized thumbnail: priority for first N cards, lazy + async decode for rest, fade-in on load */
const RouteThumbnail = ({ src, alt, isPriority }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="route-thumbnail-wrap">
      <img
        src={src}
        alt={alt}
        loading={isPriority ? 'eager' : 'lazy'}
        fetchPriority={isPriority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={loaded ? 'route-thumbnail-loaded' : ''}
      />
    </div>
  );
};

export const HikeRoutes = (props) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [likeError, setLikeError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      setLoading(true);
      setData([]);
      setPage(1);
      try {
        const params = new URLSearchParams({ page: 1, per_page: 20 });
        if (showFollowingOnly) params.set('scope', 'following');

        const responseData = await authenticatedFetch(`/routes?${params.toString()}`);
        setData(responseData.data || []);
        setTotalPages(responseData.meta?.total_pages || 1);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [showFollowingOnly]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: nextPage, per_page: 20 });
      if (showFollowingOnly) params.set('scope', 'following');

      const responseData = await authenticatedFetch(`/routes?${params.toString()}`);
      setData((prev) => [...prev, ...(responseData.data || [])]);
      setTotalPages(responseData.meta?.total_pages || totalPages);
      setPage(nextPage);
    } catch (error) {
      setLikeError(error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleLike = async (routeId, currentlyLiked) => {
    if (!userIsAuthenticated) {
      setLikeError('Uloguj se da bi lajkovala rute.');
      return;
    }

    setLikeError(null);

    const optimisticLiked = !currentlyLiked;
    const delta = optimisticLiked ? 1 : -1;

    setData((currentData) => currentData?.map((route) => {
      if (route.id !== routeId) return route;

      return {
        ...route,
        liked_by_current_user: optimisticLiked,
        likes_count: Math.max((route.likes_count || 0) + delta, 0)
      };
    }));

    try {
      const responseData = await authenticatedFetch(`/routes/${routeId}/like`, {
        method: currentlyLiked ? 'DELETE' : 'POST'
      });

      setData((currentData) => currentData?.map((route) => (
        route.id === routeId
          ? {
              ...route,
              liked_by_current_user: responseData.data.liked_by_current_user,
              likes_count: responseData.data.likes_count
            }
          : route
      )));
    } catch (error) {
      setData((currentData) => currentData?.map((route) => {
        if (route.id !== routeId) return route;

        return {
          ...route,
          liked_by_current_user: currentlyLiked,
          likes_count: Math.max((route.likes_count || 0) - delta, 0)
        };
      }));
      setLikeError(error.message);
    }
  };

  if (error) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
          <div className="routes-overlay" />
        </div>
      <div className="page-container">
        <div className="alert-error-modern">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>⚠️ Greška</h3>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{error}</p>
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
        <div className="page-container">
          <AppLoader
            title="Učitavanje ruta"
            subtitle="Pripremamo sve potrebno za vašu avanturu..."
          />
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
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>
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

        {userIsAuthenticated && (
          <div style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={showFollowingOnly ? 'btn-primary-modern' : 'btn-secondary-modern'}
              style={{ borderRadius: '999px', padding: '0.5rem 1.4rem', fontSize: '0.9rem' }}
              onClick={() => setShowFollowingOnly((prev) => !prev)}
            >
              {showFollowingOnly ? 'Prikaži sve rute' : 'Samo rute koje pratiš'}
            </button>
          </div>
        )}

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
          {likeError && (
            <p style={{ marginTop: '0.5rem', color: '#ffb4b4', fontSize: '0.9rem' }}>
              {likeError}
            </p>
          )}
        </div>

        <div className="hike-cards-container">
          {filteredRoutes && filteredRoutes.length > 0 ? (
            filteredRoutes.map((hike, index) => (
            <div key={`${hike.title}-${index}`} className="hike-card">
              {hike.thumbnail_url && (
                <RouteThumbnail
                  src={hike.thumbnail_url}
                  alt={hike.title}
                  isPriority={index < 3}
                />
              )}
              <div className="hike-card-content">
                {hike.author && (
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#4a5568'
                      }}
                    >
                      {hike.author.avatar_url ? (
                        <img
                          src={hike.author.avatar_url}
                          alt={hike.author.name}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (hike.author.name || '?').trim().charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      Autor: <span style={{ fontWeight: 600 }}>{hike.author.name}</span>
                    </div>
                  </div>
                )}
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
                <button
                  type="button"
                  className={`route-like-button ${hike.liked_by_current_user ? 'liked' : ''}`}
                  onClick={() => handleToggleLike(hike.id, hike.liked_by_current_user)}
                  aria-pressed={!!hike.liked_by_current_user}
                  aria-label={hike.liked_by_current_user ? 'Ukloni lajk sa rute' : 'Lajkuj rutu'}
                >
                  <span className="route-like-heart" aria-hidden="true">♥</span>
                  <span className="route-like-count">{hike.likes_count || 0}</span>
                </button>
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

        {page < totalPages && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn-secondary-modern"
              style={{ borderRadius: '999px', padding: '0.75rem 2rem', fontSize: '1rem' }}
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Učitavanje...' : 'Učitaj još ruta'}
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
