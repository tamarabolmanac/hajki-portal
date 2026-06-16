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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [radius, setRadius] = useState(null);        // null | 5 | 10 | 25 | 50
  const [myRoutesOnly, setMyRoutesOnly] = useState(false);
  const [followingOnly, setFollowingOnly] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Broji aktivne filtere za badge
  const activeFilterCount = [radius, myRoutesOnly, followingOnly].filter(Boolean).length;
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
        if (radius && userLocation) {
          // Nearby: filtriraj rezultate po scope-u client-side
          const currentUserId = (() => {
            const id = localStorage.getItem('userID');
            if (id) return Number(id);
            try { return JSON.parse(localStorage.getItem('userDetails') || 'null')?.id; } catch { return null; }
          })();
          const responseData = await authenticatedFetch(`/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`);
          let routes = responseData.data || [];
          if (myRoutesOnly && currentUserId) routes = routes.filter(r => r.user_id === currentUserId || r.author?.id === currentUserId);
          setData(routes);
          setTotalPages(1);
        } else if (myRoutesOnly) {
          const responseData = await authenticatedFetch('/my_routes');
          setData(Array.isArray(responseData) ? responseData : (responseData.data || []));
          setTotalPages(1);
        } else {
          const params = new URLSearchParams({ page: 1, per_page: 20 });
          if (followingOnly) params.set('scope', 'following');
          const responseData = await authenticatedFetch(`/routes?${params.toString()}`);
          setData(responseData.data || []);
          setTotalPages(responseData.meta?.total_pages || 1);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [radius, userLocation, myRoutesOnly, followingOnly]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: nextPage, per_page: 20 });
      if (followingOnly && !myRoutesOnly && !radius) params.set('scope', 'following');

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

  const handleToggleBookmark = async (routeId, currentlyBookmarked) => {
    if (!userIsAuthenticated) {
      setLikeError('Uloguj se da bi sačuvala rute.');
      return;
    }
    const optimistic = !currentlyBookmarked;
    setData((curr) => curr?.map((r) =>
      r.id === routeId ? { ...r, bookmarked_by_current_user: optimistic } : r
    ));
    try {
      await authenticatedFetch(`/routes/${routeId}/bookmark`, {
        method: currentlyBookmarked ? 'DELETE' : 'POST'
      });
    } catch {
      // rollback
      setData((curr) => curr?.map((r) =>
        r.id === routeId ? { ...r, bookmarked_by_current_user: currentlyBookmarked } : r
      ));
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

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationError('Geolokacija nije podržana.'); return; }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); },
      () => { setLocationError('Pristup lokaciji odbijen.'); setLocationLoading(false); setRadius(null); }
    );
  };

  const handleRadiusChange = (val) => {
    setRadius(val);
    if (val && !userLocation) requestLocation();
  };

  const resetFilters = () => {
    setRadius(null); setMyRoutesOnly(false); setFollowingOnly(false);
    setLocationError(null); setFiltersOpen(false);
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
          <div style={{ margin: '1.5rem 0', position: 'relative' }}>
            {/* Filter trigger dugme */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setFiltersOpen(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '999px',
                  border: filtersOpen || activeFilterCount > 0
                    ? '2px solid #11998e'
                    : '1px solid rgba(255,255,255,0.25)',
                  background: filtersOpen || activeFilterCount > 0
                    ? 'rgba(17,153,142,0.18)'
                    : 'rgba(255,255,255,0.07)',
                  color: 'white',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: activeFilterCount > 0 ? 600 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {/* Filter ikona */}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                Filteri
                {activeFilterCount > 0 && (
                  <span style={{
                    background: '#11998e', color: 'white',
                    borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, marginLeft: 2,
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
                >
                  × Resetuj
                </button>
              )}
            </div>

            {/* Filter panel */}
            {filtersOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                background: 'rgba(19,78,74,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                minWidth: 280, zIndex: 100,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              }}>
                {/* Radijus pretrage */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Radijus pretrage
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[null, 5, 10, 25, 50].map(val => (
                      <button
                        key={val ?? 'all'}
                        type="button"
                        onClick={() => handleRadiusChange(val)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          border: radius === val ? '2px solid #38ef7d' : '1px solid rgba(255,255,255,0.2)',
                          background: radius === val ? 'rgba(56,239,125,0.15)' : 'rgba(255,255,255,0.06)',
                          color: radius === val ? '#38ef7d' : 'rgba(255,255,255,0.75)',
                          fontSize: '0.85rem', fontWeight: radius === val ? 700 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {val === null ? 'Sve' : `${val} km`}
                      </button>
                    ))}
                  </div>
                  {locationLoading && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>📍 Tražim lokaciju...</p>}
                  {locationError && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#ffb4b4' }}>{locationError}</p>}
                  {radius && userLocation && !locationLoading && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#38ef7d' }}>✓ Lokacija pronađena</p>
                  )}
                </div>

                {/* Checkboxovi */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={myRoutesOnly}
                      onChange={e => { setMyRoutesOnly(e.target.checked); if (e.target.checked) setFollowingOnly(false); }}
                      style={{ width: 16, height: 16, accentColor: '#11998e', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>Samo moje rute</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={followingOnly}
                      onChange={e => { setFollowingOnly(e.target.checked); if (e.target.checked) setMyRoutesOnly(false); }}
                      style={{ width: 16, height: 16, accentColor: '#11998e', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>Samo rute korisnika koje pratim</span>
                  </label>
                </div>
              </div>
            )}
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
              {hike.author && (
                <div className="hike-card-author">
                  <div className="hike-card-author-avatar">
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
                  <div className="hike-card-author-name">
                    Autor: <span style={{ fontWeight: 600 }}>{hike.author.name}</span>
                  </div>
                </div>
              )}
              {hike.thumbnail_url && (
                <RouteThumbnail
                  src={hike.thumbnail_url}
                  alt={hike.title}
                  isPriority={index < 3}
                />
              )}
              <div className="hike-card-content">
                <h3 className="hike-title">{hike.title}</h3>
                <p className="hike-description">{hike.description}</p>
                {hike.description && hike.description.length > 120 && (
                  <Link to={`/route/${hike.id}`} className="hike-read-more">Pročitaj više →</Link>
                )}
                <div className="hike-details">
                  <span className="hike-badge">
                    ⏱ {hike.duration}min
                  </span>
                  <span className="hike-badge">{hike.difficulty}</span>
                  {hike.distance && (
                    <span className="hike-badge">
                      👣 {hike.distance}km
                    </span>
                  )}
                </div>
              </div>
              <div className="hike-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  <button
                    type="button"
                    className={`route-bookmark-button ${hike.bookmarked_by_current_user ? 'bookmarked' : ''}`}
                    onClick={() => handleToggleBookmark(hike.id, hike.bookmarked_by_current_user)}
                    aria-pressed={!!hike.bookmarked_by_current_user}
                    aria-label={hike.bookmarked_by_current_user ? 'Ukloni iz sačuvanih' : 'Sačuvaj rutu'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={hike.bookmarked_by_current_user ? '#8FA31E' : 'none'} stroke="#8FA31E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
                <Link to={`/route/${hike.id}`} className="btn-card-details">
                  Detalji →
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

        {page < totalPages && !myRoutesOnly && !radius && (
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
