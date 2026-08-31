import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { isMobileApp } from '../utils/platform';
import AppLoader from './AppLoader';
import RouteCard from './RouteCard';
import TagPicker from './TagPicker';
import ActivityIcon from './ActivityIcon';
import { useT } from '../i18n/I18nProvider';
import '../styles/Explore.css';

const HERO_IMG = '/img/routes-bgd.jpg';
const diffKey = (d) => {
  const v = (d || '').toLowerCase();
  if (v.includes('hard') || v.includes('teš') || v.includes('tes')) return 'hard';
  if (v.includes('eas') || v.includes('lak')) return 'easy';
  return 'medium';
};
const DIFF_PILLS = ['all', 'easy', 'medium', 'hard'];

const FILTERS_STORAGE_KEY = 'explore:filters';
const readSavedFilters = () => {
  try { return JSON.parse(sessionStorage.getItem(FILTERS_STORAGE_KEY) || 'null') || {}; }
  catch { return {}; }
};

// Page shell (module-level so it isn't remounted on every render → input keeps focus)
const Shell = ({ children }) => {
  const { t } = useT();
  return (
    <div className="ex2-page">
      <div className="ex2-hero">
        <img className="ex2-hero__img" src={HERO_IMG} alt="" />
        <div className="ex2-hero__ov" />
        <div className="ex2-hero__c">
          <p className="ex2-kicker">{t('home.kicker')}</p>
          <h1 className="ex2-title">{t('ex.heroTitle')}</h1>
        </div>
      </div>
      <div className="ex2-inner">{children}</div>
    </div>
  );
};

export const HikeRoutes = (props) => {
  const { t } = useT();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  // Filteri prežive odlazak na detalje rute i povratak (sessionStorage);
  // gube se tek zatvaranjem taba/aplikacije.
  const [saved] = useState(readSavedFilters);
  const [searchTerm, setSearchTerm] = useState(saved.searchTerm || '');
  const [debouncedSearch, setDebouncedSearch] = useState((saved.searchTerm || '').trim());
  const [diff, setDiff] = useState(saved.diff || 'all');
  const [activeTags, setActiveTags] = useState(saved.activeTags || []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [radius, setRadius] = useState(saved.radius ?? null); // null | 5 | 10 | 25 | 50
  const [myRoutesOnly, setMyRoutesOnly] = useState(!!saved.myRoutesOnly);
  const [followingOnly, setFollowingOnly] = useState(!!saved.followingOnly);
  // Tip aktivnosti — oba čekirana (default) = prikaži sve; samo jedan = filtriraj.
  const [activityHike, setActivityHike] = useState(saved.activityHike !== false);
  const [activityBike, setActivityBike] = useState(saved.activityBike !== false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Broji aktivne filtere za badge
  // hike-only ili bike-only kad je čekiran tačno jedan; inače null (prikaži sve).
  const activityParam = activityHike && !activityBike ? 'hike' : activityBike && !activityHike ? 'bike' : null;
  const activeFilterCount = [radius, myRoutesOnly, followingOnly, activityParam].filter(Boolean).length;
  const totalActiveFilters = activeFilterCount + (diff !== 'all' ? 1 : 0) + activeTags.length;
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

  // Debounce search input so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Persist filters so they survive route-detail → back navigation.
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
        searchTerm, diff, activeTags, radius, myRoutesOnly, followingOnly, activityHike, activityBike,
      }));
    } catch { /* storage unavailable */ }
  }, [searchTerm, diff, activeTags, radius, myRoutesOnly, followingOnly, activityHike, activityBike]);

  // Restored radius filter needs the location re-acquired after remount.
  useEffect(() => {
    if (radius && !userLocation && !locationLoading) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (activityParam) routes = routes.filter(r => (r.activity_type || 'hike') === activityParam);
          setData(routes);
          setTotalPages(1);
        } else if (myRoutesOnly) {
          const responseData = await authenticatedFetch('/my_routes');
          let routes = Array.isArray(responseData) ? responseData : (responseData.data || []);
          if (activityParam) routes = routes.filter(r => (r.activity_type || 'hike') === activityParam);
          setData(routes);
          setTotalPages(1);
        } else {
          const params = new URLSearchParams({ page: 1, per_page: 20 });
          if (followingOnly) params.set('scope', 'following');
          if (diff !== 'all') params.set('difficulty', diff);
          if (debouncedSearch) params.set('q', debouncedSearch);
          if (activeTags.length) params.set('tags', activeTags.join(','));
          if (activityParam) params.set('activity', activityParam);
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
  }, [radius, userLocation, myRoutesOnly, followingOnly, diff, debouncedSearch, activeTags, activityParam]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: nextPage, per_page: 20 });
      if (followingOnly && !myRoutesOnly && !radius) params.set('scope', 'following');
      if (diff !== 'all') params.set('difficulty', diff);
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (activeTags.length) params.set('tags', activeTags.join(','));
      if (activityParam) params.set('activity', activityParam);

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
      setLikeError(t('ex.loginBookmark'));
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
      setLikeError(t('ex.loginLike'));
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
    if (!navigator.geolocation) { setLocationError(t('ex.locUnsupported')); return; }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); },
      () => { setLocationError(t('ex.locDenied')); setLocationLoading(false); setRadius(null); }
    );
  };

  const handleRadiusChange = (val) => {
    setRadius(val);
    if (val && !userLocation) requestLocation();
  };

  const resetAllFilters = () => {
    setSearchTerm(''); setDebouncedSearch('');
    setDiff('all'); setActiveTags([]);
    setRadius(null); setMyRoutesOnly(false); setFollowingOnly(false);
    setActivityHike(true); setActivityBike(true);
    setLocationError(null);
    try { sessionStorage.removeItem(FILTERS_STORAGE_KEY); } catch { /* ignore */ }
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
    return <Shell><AppLoader title={t('ex.loadingTitle')} subtitle={t('ex.loadingSub')} /></Shell>;
  }

  return (
    <Shell>
      {/* search + add */}
      <div className="ex2-searchrow">
        <div className="ex2-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder={t('ex.searchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Mobile app already has the ADD tab in the bottom nav — web keeps the button. */}
        {userIsAuthenticated ? (
          !isMobileApp() && <Link to="/new-route" className="ex2-add">{t('ex.add')}</Link>
        ) : (
          <Link to="/login" className="ex2-add">{t('ex.login')}</Link>
        )}
      </div>

      {/* single filter toggle */}
      <div className="ex2-filters">
        <Link to="/map-search" className="ex2-fbtn" style={{ marginLeft: 0, marginRight: 'auto' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          {t('ex.mapSearch')}
        </Link>
        <button type="button" className={`ex2-fbtn ${filtersOpen || totalActiveFilters > 0 ? 'is-active' : ''}`} onClick={() => setFiltersOpen((v) => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
          {t('ex.filters')}{totalActiveFilters > 0 && <span className="ex2-fbadge">{totalActiveFilters}</span>}
        </button>
        {(totalActiveFilters > 0 || searchTerm) && (
          <button type="button" className="ex2-freset" onClick={resetAllFilters}>
            {t('ex.resetAll')}
          </button>
        )}
      </div>

      {/* unified filter panel */}
      {filtersOpen && (
        <div className="ex2-panel">
          {/* težina */}
          <p className="ex2-panel__label">{t('ex.difficulty')}</p>
          <div className="ex2-radii">
            {DIFF_PILLS.map((key) => (
              <button key={key} type="button" className={`ex2-pill ${diff === key ? 'is-active' : ''}`} onClick={() => setDiff(key)}>
                {t(`diff.${key}`)}
              </button>
            ))}
          </div>

          {/* tip aktivnosti */}
          <p className="ex2-panel__label" style={{ marginTop: '1.1rem' }}>{t('form.activity')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="ex2-check">
              <input type="checkbox" checked={activityHike} onChange={(e) => setActivityHike(e.target.checked)} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <ActivityIcon type="hike" size={16} /> {t('form.hike')}
              </span>
            </label>
            <label className="ex2-check">
              <input type="checkbox" checked={activityBike} onChange={(e) => setActivityBike(e.target.checked)} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <ActivityIcon type="bike" size={16} /> {t('form.bike')}
              </span>
            </label>
          </div>

          {/* karakteristike */}
          <p className="ex2-panel__label" style={{ marginTop: '1.1rem' }}>{t('ex.characteristics')}</p>
          <TagPicker value={activeTags} onChange={setActiveTags} />

          {/* radijus + scope (samo za prijavljene) */}
          {userIsAuthenticated && (
            <>
              <p className="ex2-panel__label" style={{ marginTop: '1.1rem' }}>{t('ex.radius')}</p>
              <div className="ex2-radii">
                {[null, 5, 10, 25, 50].map((val) => (
                  <button key={val ?? 'all'} type="button" className={`ex2-pill ${radius === val ? 'is-active' : ''}`} onClick={() => handleRadiusChange(val)}>
                    {val === null ? t('diff.all') : `${val} km`}
                  </button>
                ))}
              </div>
              {locationLoading && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6b7f6d' }}>{t('ex.searching')}</p>}
              {locationError && <p className="ex2-error" style={{ margin: '0.5rem 0 0' }}>{locationError}</p>}
              {radius && userLocation && !locationLoading && <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#50c878' }}>{t('ex.locFound')}</p>}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label className="ex2-check">
                  <input type="checkbox" checked={myRoutesOnly} onChange={(e) => { setMyRoutesOnly(e.target.checked); if (e.target.checked) setFollowingOnly(false); }} />
                  {t('ex.myRoutes')}
                </label>
                <label className="ex2-check">
                  <input type="checkbox" checked={followingOnly} onChange={(e) => { setFollowingOnly(e.target.checked); if (e.target.checked) setMyRoutesOnly(false); }} />
                  {t('ex.following')}
                </label>
              </div>
            </>
          )}

          {totalActiveFilters > 0 && (
            <button type="button" onClick={resetAllFilters} style={{ marginTop: '1rem', background: 'none', border: 'none', color: '#6b7f6d', cursor: 'pointer', fontSize: '0.85rem' }}>{t('ex.resetAll')}</button>
          )}
        </div>
      )}

      <p className="ex2-count">{filteredRoutes.length} {filteredRoutes.length === 1 ? t('ex.count_one') : t('ex.count_many')}</p>
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
          <p>{searchTerm || diff !== 'all' || activeTags.length > 0 ? t('ex.emptyFilter') : t('ex.empty')}</p>
        </div>
      )}

      {page < totalPages && !myRoutesOnly && !radius && (
        <button type="button" className="ex2-loadmore" onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? t('ex.loadingMore') : t('ex.loadMore')}
        </button>
      )}
    </Shell>
  );
}

