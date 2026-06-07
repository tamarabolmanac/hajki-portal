import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import LocationTracker from './LocationTracker';
import { BackgroundImage } from './BackgroundImage';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div className="page-container">
        <div className="alert-error-modern"><p>{error}</p></div>
      </div>
    );
  }

  const initials = (name || userDetails?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>
    <div className="page-container" style={{ maxWidth: 760 }}>

      {/* Hero — avatar + ime + stats */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 2rem 2rem' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '50%', overflow: 'hidden',
            background: 'linear-gradient(135deg, #11998e, #38ef7d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 700, color: 'white',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(17,153,142,0.4)',
            margin: '0 auto'
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <label style={{
            position: 'absolute', bottom: 0, right: 0,
            background: 'linear-gradient(135deg, #11998e, #38ef7d)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: '0.85rem' }}>📷</span>
            <input type="file" accept="image/*" onChange={onAvatarChange} style={{ display: 'none' }} />
          </label>
        </div>

        <h1 style={{
          margin: '0 0 0.25rem',
          fontSize: '1.75rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff, #f0fdf4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>
          {name || userDetails?.name || 'Planinar'}
        </h1>
        {(city || country) && (
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
            📍 {[city, country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '🥾', value: `${(userDetails?.total_distance || 0).toFixed(1)} km`, label: 'Prepešačeno' },
            { icon: '⏱️', value: formatDuration(userDetails?.total_duration || 0), label: 'Vreme u prirodi' },
            { icon: '🗺️', value: userDetails?.routes_count || 0, label: 'Ruta' },
          ].map(({ icon, value, label }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '0.75rem 1.25rem',
              minWidth: 100, flex: '1 1 100px'
            }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#38ef7d' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Forma za uređivanje */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
          Uredi profil
        </h2>

        <form onSubmit={saveProfile}>
          {[
            { label: 'Ime', value: name, onChange: setName },
            { label: 'Grad', value: city, onChange: setCity },
            { label: 'Zemlja', value: country, onChange: setCountry },
          ].map(({ label, value, onChange }) => (
            <div key={label} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
                {label}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12, color: 'white', fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          ))}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
              Email
            </label>
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontSize: '1rem'
            }}>
              {userDetails?.email}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary-modern" disabled={saving} style={{ borderRadius: 12 }}>
              {saving ? 'Čuvanje...' : 'Sačuvaj izmene'}
            </button>
            {savedMsg && (
              <span style={{ color: '#38ef7d', fontSize: '0.9rem', fontWeight: 600 }}>✓ {savedMsg}</span>
            )}
          </div>
        </form>
      </div>

      {/* Lokacija */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
          Moja lokacija
        </h2>
        <LocationTracker />
      </div>

      {/* Moje rute */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: myRoutes ? '1.25rem' : 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            Moje rute
          </h2>
          {myRoutes === null && (
            <button
              className="btn-secondary-modern"
              style={{ borderRadius: '999px', padding: '0.45rem 1.2rem', fontSize: '0.875rem' }}
              onClick={loadMyRoutes}
              disabled={routesLoading}
            >
              {routesLoading ? 'Učitavanje...' : 'Prikaži'}
            </button>
          )}
          {myRoutes !== null && (
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {myRoutes.length} {myRoutes.length === 1 ? 'ruta' : 'ruta'}
            </span>
          )}
        </div>

        {routesError && (
          <p style={{ color: '#ffb4b4', fontSize: '0.9rem', margin: '0.75rem 0 0' }}>{routesError}</p>
        )}

        {myRoutes !== null && myRoutes.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', margin: 0 }}>
            Još nemaš sačuvanih ruta.{' '}
            <Link to="/new-route" style={{ color: '#38ef7d', textDecoration: 'none', fontWeight: 600 }}>
              Dodaj prvu →
            </Link>
          </p>
        )}

        {myRoutes && myRoutes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myRoutes.map((route) => (
              <Link
                key={route.id}
                to={`/route/${route.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  transition: 'background 0.15s',
                }}>
                  {route.thumbnail_url && (
                    <img
                      src={route.thumbnail_url}
                      alt={route.title}
                      style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {route.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {route.distance_km ? `${parseFloat(route.distance_km).toFixed(1)} km` : ''}
                      {route.distance_km && route.duration_minutes ? ' · ' : ''}
                      {route.duration_minutes ? formatDuration(route.duration_minutes) : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteRoute(e, route.id)}
                    disabled={deletingId === route.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,100,100,0.6)', fontSize: '1.1rem',
                      padding: '4px 6px', flexShrink: 0, lineHeight: 1,
                    }}
                    title="Obriši rutu"
                  >
                    {deletingId === route.id ? '…' : '🗑'}
                  </button>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sačuvane rute */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: savedRoutes ? '1.25rem' : 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#8FA31E" stroke="#8FA31E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            Sačuvane rute
          </h2>
          {savedRoutes === null && (
            <button
              className="btn-secondary-modern"
              style={{ borderRadius: '999px', padding: '0.45rem 1.2rem', fontSize: '0.875rem' }}
              onClick={loadSavedRoutes}
              disabled={savedRoutesLoading}
            >
              {savedRoutesLoading ? 'Učitavanje...' : 'Prikaži'}
            </button>
          )}
          {savedRoutes !== null && (
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {savedRoutes.length} {savedRoutes.length === 1 ? 'ruta' : 'ruta'}
            </span>
          )}
        </div>

        {savedRoutes !== null && savedRoutes.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', margin: 0 }}>
            Još nisi sačuvala nijednu rutu.{' '}
            <Link to="/routes" style={{ color: '#38ef7d', textDecoration: 'none', fontWeight: 600 }}>
              Istraži rute →
            </Link>
          </p>
        )}

        {savedRoutes && savedRoutes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {savedRoutes.map((route) => (
              <Link key={route.id} to={`/route/${route.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  transition: 'background 0.15s',
                }}>
                  {route.thumbnail_url && (
                    <img src={route.thumbnail_url} alt={route.title}
                      style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {route.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                      {route.distance ? `${Number(route.distance).toFixed(1)} km` : ''}
                      {route.distance && route.duration ? ' · ' : ''}
                      {route.duration ? `${route.duration} min` : ''}
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1rem' }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="glass-card" style={{ marginTop: '1.5rem', borderColor: 'rgba(239,68,68,0.3)' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: 'rgba(255,100,100,0.85)' }}>
          Brisanje naloga
        </h2>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
          Brisanje naloga je trajno. Svi tvoji podaci, rute i slike biće nepovratno obrisani.
        </p>
        <button
          onClick={deleteAccount}
          disabled={deletingAccount}
          style={{
            background: 'linear-gradient(135deg, #c62828, #e53935)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: deletingAccount ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            opacity: deletingAccount ? 0.7 : 1,
          }}
        >
          {deletingAccount ? 'Brisanje...' : '🗑️ Obriši nalog'}
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '1rem 0 2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
        <Link to="/privacy-policy" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}>
          Politika privatnosti
        </Link>
      </div>

    </div>
    </div>
  );
};

export default Profile;
