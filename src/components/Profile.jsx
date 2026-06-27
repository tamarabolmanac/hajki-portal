import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import LocationTracker from './LocationTracker';
import ConfirmModal from './ConfirmModal';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '../i18n/I18nProvider';
import '../styles/Profile.css';

const formatDuration = (minutes) => {
  if (!minutes) return '0h 0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

export const Profile = () => {
  const { t } = useT();
  // Učitaj iz keša odmah da ne čekamo API na mobilnom
  const cachedUser = (() => {
    try { return JSON.parse(localStorage.getItem('userDetails') || 'null'); } catch { return null; }
  })();

  const [userDetails, setUserDetails] = useState(cachedUser);
  const [loading, setLoading] = useState(!cachedUser); // ako ima keš, ne pokazuj spinner
  const [error, setError] = useState(null);
  const [name, setName] = useState(cachedUser?.name || '');
  const [city, setCity] = useState(cachedUser?.city || '');
  const [country, setCountry] = useState(cachedUser?.country || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(cachedUser?.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [myRoutes, setMyRoutes] = useState(null);   // null = nije učitano
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState(null);   // null = nije učitano
  const [savedRoutesLoading, setSavedRoutesLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000); // 10s timeout

    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const data = await authenticatedFetch('/user_data', { signal: controller.signal });
        setUserDetails(data);
        localStorage.setItem('userDetails', JSON.stringify(data));
        setName(data?.name || '');
        setCity(data?.city || '');
        setCountry(data?.country || '');
        setAvatarPreview(data?.avatar_url || null);
      } catch (err) {
        if (err.name === 'AbortError') {
          // Ako je timedOut=false, abort je došao od cleanup-a (unmount) — ignorišemo
          if (timedOut) {
            setError('Veza je istekla. Proveri internet konekciju i pokušaj ponovo.');
          }
        } else {
          setError(`Greška: ${err.message}`);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    fetchUserProfile();

    return () => { controller.abort(); clearTimeout(timeoutId); };
  }, []);

  const handleLogout = () => {
    ['authToken', 'user', 'userID', 'userDetails'].forEach((k) => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  const onAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Otvori potvrdu za brisanje rute (stvarno brisanje u confirmDeleteRoute).
  const requestDeleteRoute = (e, route) => {
    e.preventDefault();
    e.stopPropagation();
    setRouteToDelete(route);
  };

  const confirmDeleteRoute = async () => {
    if (!routeToDelete) return;
    const routeId = routeToDelete.id;
    setDeletingId(routeId);
    try {
      await authenticatedFetch(`/routes/${routeId}`, { method: 'DELETE' });
      setMyRoutes(prev => prev.filter(r => r.id !== routeId));
      setRouteToDelete(null);
    } catch (err) {
      alert(`Greška pri brisanju: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteAccount = async () => {
    const userId = userDetails?.id || localStorage.getItem('userID');
    if (!userId) return;
    setDeletingAccount(true);
    try {
      await authenticatedFetch(`/users/${userId}/request_deletion`, { method: 'POST' });
      setShowDeleteAccount(false);
      alert('Email za potvrdu brisanja naloga je poslat. Proveri inbox i klikni na link da potvrdiš.');
    } catch (err) {
      alert(`Greška: ${err.message}`);
    } finally {
      setDeletingAccount(false);
    }
  };

  const loadMyRoutes = async () => {
    if (myRoutes !== null) return; // već učitano
    setRoutesLoading(true);
    setRoutesError(null);
    try {
      const data = await authenticatedFetch('/my_routes');
      setMyRoutes(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      setRoutesError(err.message);
    } finally {
      setRoutesLoading(false);
    }
  };

  const loadSavedRoutes = async () => {
    if (savedRoutes !== null) return;
    setSavedRoutesLoading(true);
    try {
      const data = await authenticatedFetch('/saved_routes');
      setSavedRoutes(data.data || []);
    } catch {
      setSavedRoutes([]);
    } finally {
      setSavedRoutesLoading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const form = new FormData();
      if (name) form.append('name', name);
      if (city) form.append('city', city);
      if (country) form.append('country', country);
      if (avatarFile) form.append('avatar', avatarFile);
      const isDevelopment = process.env.NODE_ENV === 'development';
      const url = isDevelopment ? '/user' : 'https://upload.hajki.com/user';
      const updated = await authenticatedFetch(url, { method: 'PUT', body: form, useProductionUrl: !isDevelopment });
      setUserDetails(updated);
      localStorage.setItem('userDetails', JSON.stringify(updated));
      setAvatarPreview(updated?.avatar_url || null);
      setAvatarFile(null);
      setSavedMsg('Uspešno sačuvano.');
    } catch (err) {
      setError(`Greška: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pf-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="loading-spinner-modern" />
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('401') || error.includes('Unauthorized') || error.includes('token');
    if (isAuthError) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userDetails');
      window.location.href = '/login';
      return null;
    }
    return (
      <div className="pf-page"><div className="pf-inner"><p style={{ color: '#e05252' }}>{error}</p></div></div>
    );
  }

  const initials = (name || userDetails?.name || '?').trim().charAt(0).toUpperCase();
  const renderRoute = (route, withDelete) => (
    <Link key={route.id} to={`/route/${route.id}`} className="pf-route">
      {route.thumbnail_url && <img src={route.thumbnail_url} alt={route.title} loading="lazy" />}
      <div className="pf-route__body">
        <div className="pf-route__title">{route.title}</div>
        <div className="pf-route__sub">
          {route.distance != null ? `${Number(route.distance ?? route.distance_km).toFixed(1)} km` : ''}
          {(route.distance != null) && (route.duration != null || route.duration_minutes != null) ? ' · ' : ''}
          {route.duration != null ? `${route.duration} min` : (route.duration_minutes ? formatDuration(route.duration_minutes) : '')}
        </div>
      </div>
      {withDelete && (
        <button
          className="pf-route__del"
          onClick={(e) => requestDeleteRoute(e, route)}
          disabled={deletingId === route.id}
          title="Obriši rutu"
        >
          {deletingId === route.id ? '…' : '🗑'}
        </button>
      )}
    </Link>
  );

  return (
    <div className="pf-page">
      <div className="pf-inner">
        <p className="pf-greet">{t('pf.greet')}</p>
        <h1 className="pf-h1">{t('pf.title')}</h1>

        {/* profile header */}
        <div className="pf-card pf-profile">
          <div className="pf-avatar">
            {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : initials}
            <label className="pf-avatar__edit" title="Promeni sliku">
              📷
              <input type="file" accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div className="pf-profile__info">
            <h2 className="pf-profile__name">{name || userDetails?.name || t('rd.hiker')}</h2>
            {userDetails?.email && <p className="pf-profile__email">{userDetails.email}</p>}
            {(city || country) && (
              <p className="pf-profile__loc">📍 {[city, country].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="pf-stats">
          <div className="pf-stat">
            <div className="pf-stat__value pf-stat__value--green">{(userDetails?.total_distance || 0).toFixed(1)}</div>
            <div className="pf-stat__label">km</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat__value">{formatDuration(userDetails?.total_duration || 0)}</div>
            <div className="pf-stat__label">{t('pf.time')}</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat__value">{userDetails?.routes_count || 0}</div>
            <div className="pf-stat__label">{t('pf.routes')}</div>
          </div>
        </div>

        {/* edit form */}
        <div className="pf-card">
          <h3 className="pf-card-title">{t('pf.editProfile')}</h3>
          <form onSubmit={saveProfile}>
            <div className="pf-field">
              <label>{t('pf.name')}</label>
              <input className="pf-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="pf-row2">
              <div className="pf-field">
                <label>{t('pf.city')}</label>
                <input className="pf-input" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="pf-field">
                <label>{t('pf.country')}</label>
                <input className="pf-input" type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div className="pf-field">
              <label>{t('pf.email')}</label>
              <div className="pf-readonly">{userDetails?.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="submit" className="pf-btn-primary" disabled={saving} style={{ width: 'auto', padding: '0.8rem 1.6rem' }}>
                {saving ? t('pf.saving') : t('pf.save')}
              </button>
              {savedMsg && <span className="pf-saved">✓ {savedMsg}</span>}
            </div>
          </form>
        </div>

        {/* location */}
        <div className="pf-card">
          <h3 className="pf-card-title">{t('pf.location')}</h3>
          <LocationTracker />
        </div>

        {/* my routes */}
        <div className="pf-card">
          <div className="pf-card-head">
            <h3 className="pf-card-title" style={{ margin: 0 }}>{t('pf.myRoutes')}</h3>
            {myRoutes === null ? (
              <button className="pf-btn-ghost" onClick={loadMyRoutes} disabled={routesLoading}>
                {routesLoading ? t('pf.loading') : t('pf.show')}
              </button>
            ) : (
              <span className="pf-count">{myRoutes.length} {t('pf.routesLabel')}</span>
            )}
          </div>
          {routesError && <p className="pf-empty">{routesError}</p>}
          {myRoutes !== null && myRoutes.length === 0 && (
            <p className="pf-empty">{t('pf.noRoutesMy')} <Link to="/new-route">{t('pf.addFirst')}</Link></p>
          )}
          {myRoutes && myRoutes.length > 0 && (
            <div className="pf-routes">{myRoutes.map((r) => renderRoute(r, true))}</div>
          )}
        </div>

        {/* saved routes */}
        <div className="pf-card">
          <div className="pf-card-head">
            <h3 className="pf-card-title" style={{ margin: 0 }}>{t('pf.savedRoutes')}</h3>
            {savedRoutes === null ? (
              <button className="pf-btn-ghost" onClick={loadSavedRoutes} disabled={savedRoutesLoading}>
                {savedRoutesLoading ? t('pf.loading') : t('pf.show')}
              </button>
            ) : (
              <span className="pf-count">{savedRoutes.length} {t('pf.routesLabel')}</span>
            )}
          </div>
          {savedRoutes !== null && savedRoutes.length === 0 && (
            <p className="pf-empty">{t('pf.noSaved')} <Link to="/routes">{t('pf.exploreLink')}</Link></p>
          )}
          {savedRoutes && savedRoutes.length > 0 && (
            <div className="pf-routes">{savedRoutes.map((r) => renderRoute(r, false))}</div>
          )}
        </div>

        {/* admin */}
        {userDetails?.role === 'admin' && (
          <div className="pf-card">
            <h3 className="pf-card-title">{t('pf.admin')}</h3>
            <Link to="/admin" className="pf-btn-ghost" style={{ display: 'inline-block' }}>{t('pf.adminPanel')}</Link>
          </div>
        )}

        {/* language */}
        <div className="pf-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="pf-card-title" style={{ margin: 0 }}>Jezik / Language</h3>
          <LanguageSwitcher />
        </div>

        {/* logout */}
        <button className="pf-btn-logout" onClick={handleLogout}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          {t('pf.logout')}
        </button>

        {/* danger */}
        <div className="pf-card pf-danger">
          <h3 className="pf-card-title">{t('pf.dangerTitle')}</h3>
          <p>{t('pf.dangerText')}</p>
          <button className="pf-btn-danger" onClick={() => setShowDeleteAccount(true)} disabled={deletingAccount}>
            {t('pf.deleteAccount')}
          </button>
        </div>

        <div className="pf-footer">
          <Link to="/privacy-policy">{t('pf.privacy')}</Link>
        </div>
      </div>

      <ConfirmModal
        open={!!routeToDelete}
        title={t('pf.deleteRouteTitle')}
        message={t('pf.deleteRouteMsg')}
        detail={routeToDelete?.title ? `"${routeToDelete.title}"` : null}
        confirmLabel={deletingId ? t('rd.deleting') : t('pf.delete')}
        busy={!!deletingId}
        onConfirm={confirmDeleteRoute}
        onCancel={() => setRouteToDelete(null)}
      />

      <ConfirmModal
        open={showDeleteAccount}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>}
        title={t('pf.deleteAccTitle')}
        message={t('pf.deleteAccMsg')}
        requireCheckLabel={t('pf.deleteAccCheck')}
        confirmLabel={deletingAccount ? t('pf.sending') : t('pf.deleteAccBtn')}
        busy={deletingAccount}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteAccount(false)}
      />
    </div>
  );
};

export default Profile;
