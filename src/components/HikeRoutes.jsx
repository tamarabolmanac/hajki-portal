import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import AppLoader from './AppLoader';
import RouteCard from './RouteCard';
import TagPicker from './TagPicker';
import '../styles/Explore.css';

const HERO_IMG = '/img/routes-bgd.jpg';
const diffKey = (d) => {
  const v = (d || '').toLowerCase();
  if (v.includes('hard') || v.includes('teš') || v.includes('tes')) return 'hard';
  if (v.includes('eas') || v.includes('lak')) return 'easy';
  return 'medium';
};
const DIFF_PILLS = [
  { key: 'all', label: 'Sve' },
  { key: 'easy', label: 'Lako' },
  { key: 'medium', label: 'Srednje' },
  { key: 'hard', label: 'Teško' },
];

// Page shell (module-level so it isn't remounted on every render → input keeps focus)
const Shell = ({ children }) => (
  <div className="ex2-page">
    <div className="ex2-hero">
      <img className="ex2-hero__img" src={HERO_IMG} alt="" />
      <div className="ex2-hero__ov" />
      <div className="ex2-hero__c">
        <p className="ex2-kicker">Otkrijte Srbiju</p>
        <h1 className="ex2-title">Pretraži rute</h1>
      </div>
    </div>
    <div className="ex2-inner">{children}</div>
  </div>
);

export const HikeRoutes = (props) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [diff, setDiff] = useState('all');
  const [activeTags, setActiveTags] = useState([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
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

  // search + difficulty filter
  const filteredRoutes = (data || []).filter((r) => {
    const matchSearch =
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiff = diff === 'all' || diffKey(r.difficulty) === diff;
    const matchTags = activeTags.length === 0 || activeTags.every((t) => (r.tags || []).includes(t));
    return matchSearch && matchDiff && matchTags;
  });

  if (error) {
    return <Shell><p className="ex2-error" style={{ marginTop: '1.5rem' }}>⚠️ {error}</p></Shell>;
  }

  if (loading) {
    return <Shell><AppLoader title="Učitavanje ruta" subtitle="Pripremamo vašu avanturu..." /></Shell>;
  }

  return (
    <Shell>
      {/* search + add */}
      <div className="ex2-searchrow">
        <div className="ex2-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Pretraži rute po nazivu ili opisu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {userIsAuthenticated ? (
          <Link to="/new-route" className="ex2-add">+ Dodaj rutu</Link>
        ) : (
          <Link to="/login" className="ex2-add">Uloguj se</Link>
        )}
      </div>

      {/* difficulty pills + advanced filter toggle */}
      <div className="ex2-filters">
        <span className="ex2-flabel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
          Težina:
        </span>
        {DIFF_PILLS.map((p) => (
          <button key={p.key} type="button" className={`ex2-pill ${diff === p.key ? 'is-active' : ''}`} onClick={() => setDiff(p.key)}>
            {p.label}
          </button>
        ))}
        <button type="button" className={`ex2-fbtn ${tagFilterOpen || activeTags.length > 0 ? 'is-active' : ''}`} onClick={() => setTagFilterOpen((v) => !v)}>
          Karakteristike{activeTags.length > 0 && <span className="ex2-fbadge">{activeTags.length}</span>}
        </button>
        {userIsAuthenticated && (
          <button type="button" className={`ex2-fbtn ${filtersOpen || activeFilterCount > 0 ? 'is-active' : ''}`} onClick={() => setFiltersOpen((v) => !v)}>
            Filteri{activeFilterCount > 0 && <span className="ex2-fbadge">{activeFilterCount}</span>}
          </button>
        )}
      </div>

      {/* tag filter panel */}
      {tagFilterOpen && (
        <div className="ex2-panel">
          <p className="ex2-panel__label">Karakteristike mesta</p>
          <TagPicker value={activeTags} onChange={setActiveTags} />
          {activeTags.length > 0 && (
            <button type="button" onClick={() => setActiveTags([])} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: '#6b7f6d', cursor: 'pointer', fontSize: '0.85rem' }}>× Poništi karakteristike</button>
          )}
        </div>
      )}

      {/* advanced filter panel */}
      {userIsAuthenticated && filtersOpen && (
        <div className="ex2-panel">
          <p className="ex2-panel__label">Radijus pretrage</p>
          <div className="ex2-radii">
            {[null, 5, 10, 25, 50].map((val) => (
              <button key={val ?? 'all'} type="button" className={`ex2-pill ${radius === val ? 'is-active' : ''}`} onClick={() => handleRadiusChange(val)}>
                {val === null ? 'Sve' : `${val} km`}
              </button>
            ))}
          </div>
          {locationLoading && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6b7f6d' }}>📍 Tražim lokaciju...</p>}
          {locationError && <p className="ex2-error" style={{ margin: '0.5rem 0 0' }}>{locationError}</p>}
          {radius && userLocation && !locationLoading && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#50c878' }}>✓ Lokacija pronađena</p>}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="ex2-check">
              <input type="checkbox" checked={myRoutesOnly} onChange={(e) => { setMyRoutesOnly(e.target.checked); if (e.target.checked) setFollowingOnly(false); }} />
              Samo moje rute
            </label>
            <label className="ex2-check">
              <input type="checkbox" checked={followingOnly} onChange={(e) => { setFollowingOnly(e.target.checked); if (e.target.checked) setMyRoutesOnly(false); }} />
              Samo rute korisnika koje pratim
            </label>
            {activeFilterCount > 0 && (
              <button type="button" onClick={resetFilters} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6b7f6d', cursor: 'pointer', fontSize: '0.85rem' }}>× Resetuj filtere</button>
            )}
          </div>
        </div>
      )}

      <p className="ex2-count">{filteredRoutes.length} {filteredRoutes.length === 1 ? 'ruta' : 'rute'}</p>
      {likeError && <p className="ex2-error">{likeError}</p>}

      {filteredRoutes.length > 0 ? (
        <div className="route-card-grid">
          {filteredRoutes.map((hike, index) => (
            <RouteCard
              key={`${hike.id}-${index}`}
              hike={hike}
              onToggleLike={handleToggleLike}
              onToggleBookmark={handleToggleBookmark}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="ex2-empty">
          <p>{searchTerm || diff !== 'all' || activeTags.length > 0 ? 'Nema ruta za ovaj filter' : 'Nema dostupnih ruta'}</p>
        </div>
      )}

      {page < totalPages && !myRoutesOnly && !radius && (
        <button type="button" className="ex2-loadmore" onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Učitavanje...' : 'Učitaj još ruta'}
        </button>
      )}
    </Shell>
  );
}

