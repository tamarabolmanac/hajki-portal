import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import LocationTracker from './LocationTracker';
import '../styles/Profile.css';

const formatDuration = (minutes) => {
  if (!minutes) return '0h 0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

export const Profile = () => {
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

  const deleteRoute = async (e, routeId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Da li si sigurna da želiš da obrišeš ovu rutu?')) return;
    setDeletingId(routeId);
    try {
      await authenticatedFetch(`/routes/${routeId}`, { method: 'DELETE' });
      setMyRoutes(prev => prev.filter(r => r.id !== routeId));
    } catch (err) {
      alert(`Greška pri brisanju: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Poslaćemo ti email sa linkom za potvrdu brisanja naloga. Nastavi?')) return;
    const userId = userDetails?.id || localStorage.getItem('userID');
    if (!userId) return;
    setDeletingAccount(true);
    try {
      await authenticatedFetch(`/users/${userId}/request_deletion`, { method: 'POST' });
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
          onClick={(e) => deleteRoute(e, route.id)}
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
        <p className="pf-greet">Dobrodošla</p>
        <h1 className="pf-h1">Moj nalog</h1>

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
            <h2 className="pf-profile__name">{name || userDetails?.name || 'Planinar'}</h2>
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
            <div className="pf-stat__label">Vreme</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat__value">{userDetails?.routes_count || 0}</div>
            <div className="pf-stat__label">Ruta</div>
          </div>
        </div>

        {/* edit form */}
        <div className="pf-card">
          <h3 className="pf-card-title">Uredi profil</h3>
          <form onSubmit={saveProfile}>
            <div className="pf-field">
              <label>Ime i prezime</label>
              <input className="pf-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="pf-row2">
              <div className="pf-field">
                <label>Grad</label>
                <input className="pf-input" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="pf-field">
                <label>Zemlja</label>
                <input className="pf-input" type="text" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div className="pf-field">
              <label>Email</label>
              <div className="pf-readonly">{userDetails?.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button type="submit" className="pf-btn-primary" disabled={saving} style={{ width: 'auto', padding: '0.8rem 1.6rem' }}>
                {saving ? 'Čuvanje...' : 'Sačuvaj'}
              </button>
              {savedMsg && <span className="pf-saved">✓ {savedMsg}</span>}
            </div>
          </form>
        </div>

        {/* location */}
        <div className="pf-card">
          <h3 className="pf-card-title">Moja lokacija</h3>
          <LocationTracker />
        </div>

        {/* my routes */}
        <div className="pf-card">
          <div className="pf-card-head">
            <h3 className="pf-card-title" style={{ margin: 0 }}>Moje rute</h3>
            {myRoutes === null ? (
              <button className="pf-btn-ghost" onClick={loadMyRoutes} disabled={routesLoading}>
                {routesLoading ? 'Učitavanje...' : 'Prikaži'}
              </button>
            ) : (
              <span className="pf-count">{myRoutes.length} ruta</span>
            )}
          </div>
          {routesError && <p className="pf-empty">{routesError}</p>}
          {myRoutes !== null && myRoutes.length === 0 && (
            <p className="pf-empty">Još nemaš ruta. <Link to="/new-route">Dodaj prvu →</Link></p>
          )}
          {myRoutes && myRoutes.length > 0 && (
            <div className="pf-routes">{myRoutes.map((r) => renderRoute(r, true))}</div>
          )}
        </div>

        {/* saved routes */}
        <div className="pf-card">
          <div className="pf-card-head">
            <h3 className="pf-card-title" style={{ margin: 0 }}>Sačuvane rute</h3>
            {savedRoutes === null ? (
              <button className="pf-btn-ghost" onClick={loadSavedRoutes} disabled={savedRoutesLoading}>
                {savedRoutesLoading ? 'Učitavanje...' : 'Prikaži'}
              </button>
            ) : (
              <span className="pf-count">{savedRoutes.length} ruta</span>
            )}
          </div>
          {savedRoutes !== null && savedRoutes.length === 0 && (
            <p className="pf-empty">Još nisi sačuvala rute. <Link to="/routes">Istraži →</Link></p>
          )}
          {savedRoutes && savedRoutes.length > 0 && (
            <div className="pf-routes">{savedRoutes.map((r) => renderRoute(r, false))}</div>
          )}
        </div>

        {/* admin */}
        {userDetails?.role === 'admin' && (
          <div className="pf-card">
            <h3 className="pf-card-title">Administracija</h3>
            <Link to="/admin" className="pf-btn-ghost" style={{ display: 'inline-block' }}>Admin panel →</Link>
          </div>
        )}

        {/* logout */}
        <button className="pf-btn-logout" onClick={handleLogout}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          Odjavi se
        </button>

        {/* danger */}
        <div className="pf-card pf-danger">
          <h3 className="pf-card-title">Brisanje naloga</h3>
          <p>Brisanje naloga je trajno. Svi tvoji podaci, rute i slike biće nepovratno obrisani.</p>
          <button className="pf-btn-danger" onClick={deleteAccount} disabled={deletingAccount}>
            {deletingAccount ? 'Brisanje...' : '🗑 Obriši nalog'}
          </button>
        </div>

        <div className="pf-footer">
          <Link to="/privacy-policy">Politika privatnosti</Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
