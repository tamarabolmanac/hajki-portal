import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { config } from '../config';
import { BackgroundImage } from './BackgroundImage';
import '../styles/RoutesList.css';

const formatDuration = (minutes) => {
  if (!minutes) return '0h 0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

export const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${config.apiUrl}/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Korisnik nije pronađen.');
        }

        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);


  const toggleFollow = async () => {
    if (!user || user.is_me) return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const method = user.is_following ? 'DELETE' : 'POST';
      const res = await fetch(
        `${config.apiUrl}/users/${id}/${user.is_following ? 'unfollow' : 'follow'}`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Greška.');

      setUser((prev) => ({ ...prev, is_following: !prev.is_following }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
          <div className="routes-overlay" />
        </div>
        <div className="page-container">
          <div className="loading-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-spinner-modern" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="routes-page">
        <div className="routes-background">
          <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
          <div className="routes-overlay" />
        </div>
        <div className="page-container">
          <div className="alert-error-modern">
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>⚠️ Greška</h3>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>{error || 'Korisnik nije pronađen.'}</p>
            <Link to="/routes" className="btn-primary-modern" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Nazad na rute
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>

      <div className="page-container">
        <div className="page-header clean">
          <h1>Profil planinara</h1>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
            background: 'linear-gradient(135deg, #11998e, #38ef7d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem', fontWeight: 700, color: 'white',
            border: '3px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(17,153,142,0.4)',
            margin: '0 auto 1rem'
          }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user.name || '?').trim().charAt(0).toUpperCase()}
          </div>

          <h2 style={{
            margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff, #f0fdf4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            {user.name}
            {user.is_me && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400, WebkitTextFillColor: 'rgba(255,255,255,0.5)' }}> (ti)</span>}
          </h2>

          {(user.city || user.country) && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
              📍 {[user.city, user.country].filter(v => v && v !== 'Unknown').join(', ') || 'Nije uneto'}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {[
              { icon: '🥾', value: `${(user.total_distance || 0).toFixed(1)} km`, label: 'Prepešačeno' },
              { icon: '⏱️', value: formatDuration(user.total_duration || 0), label: 'Vreme u prirodi' },
              { icon: '🗺️', value: user.routes_count || 0, label: 'Ruta' },
            ].map(({ icon, value, label }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 14, padding: '0.65rem 1rem', minWidth: 90, flex: '1 1 90px'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#38ef7d' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {!user.is_me && user.is_following !== undefined && (
            <button
              type="button"
              className={user.is_following ? 'btn-unfollow' : 'btn-primary-modern'}
              style={{ borderRadius: 10, padding: '0.65rem 1.5rem' }}
              onClick={toggleFollow}
            >
              {user.is_following ? 'Otprati' : 'Prati'}
            </button>
          )}
        </div>

        {/* Rute ovog korisnika */}
        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <div className="header-with-button" style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#ffffff' }}>
              Rute ovog planinara
            </h2>
          </div>

          {!user.routes || user.routes.length === 0 ? (
            <p className="hike-description" style={{ marginBottom: 0 }}>
              Ovaj korisnik još uvek nije podelio nijednu rutu.
            </p>
          ) : (
            <div className="hike-cards-container">
              {user.routes.map((route) => (
                <div key={route.id} className="hike-card">
                  <div className="hike-card-content">
                    <h3 className="hike-title" style={{ marginBottom: '0.4rem' }}>
                      {route.title}
                    </h3>
                    {route.description && (
                      <p className="hike-description">
                        {route.description.length > 140
                          ? `${route.description.slice(0, 140)}…`
                          : route.description}
                      </p>
                    )}
                    <div className="hike-details">
                      <span className="hike-duration">
                        🕒{` ${(route.duration || 0)} min`}
                      </span>
                      <span className="hike-distance">
                        🥾{` ${(route.distance || 0).toFixed ? route.distance.toFixed(2) : Number(route.distance || 0).toFixed(2)} km`}
                      </span>
                      <span className="hike-points">
                        📍{` ${route.points_count || 0} tačaka`}
                      </span>
                    </div>
                  </div>
                  <div className="hike-card-footer">
                    <Link
                      to={`/route/${route.id}`}
                      className="btn-primary-modern"
                      style={{ borderRadius: '8px' }}
                    >
                      Pogledaj rutu
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/routes" className="btn-secondary-modern" style={{ borderRadius: 8 }}>
              ← Nazad na rute
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
