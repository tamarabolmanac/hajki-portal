import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { config } from '../config';
import { BackgroundImage } from './BackgroundImage';
import '../styles/RoutesList.css';

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

        <div className="glass-card">
          <div className="hike-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e2e8f0',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                color: '#4a5568',
                fontSize: '2rem',
              }}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user.name || '?').trim().charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 className="hike-title" style={{ marginBottom: '0.5rem' }}>
                {user.name}
                {user.is_me && (
                  <span style={{ marginLeft: 8, fontSize: 14, color: '#718096', fontWeight: 400 }}>(ti)</span>
                )}
              </h2>
              <p className="hike-description" style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                <strong>Grad:</strong>{' '}
                {user.city && user.city !== 'Unknown' ? user.city : 'Nije uneto'}
              </p>
              <p className="hike-description" style={{ marginBottom: 0, fontSize: '0.95rem' }}>
                <strong>Država:</strong>{' '}
                {user.country && user.country !== 'Unknown' ? user.country : 'Nije uneto'}
              </p>
            </div>
            {!user.is_me && user.is_following !== undefined && (
              <div>
                <button
                  type="button"
                  className={user.is_following ? 'btn-unfollow' : 'btn-primary-modern'}
                  style={{ borderRadius: 8, padding: '0.75rem 1.5rem' }}
                  onClick={toggleFollow}
                >
                  {user.is_following ? 'Otprati' : 'Prati'}
                </button>
              </div>
            )}
          </div>

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
