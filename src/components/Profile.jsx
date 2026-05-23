import React, { useState, useEffect } from 'react';
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
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const data = await authenticatedFetch('/user_data');
        setUserDetails(data);
        localStorage.setItem('userDetails', JSON.stringify(data));
        setName(data?.name || '');
        setCity(data?.city || '');
        setCountry(data?.country || '');
        setAvatarPreview(data?.avatar_url || null);
      } catch (err) {
        setError(`Greška: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const onAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
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

    </div>
    </div>
  );
};

export default Profile;
