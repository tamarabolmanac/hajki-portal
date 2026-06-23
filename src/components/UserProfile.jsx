import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { config } from '../config';
import { authenticatedFetch } from '../utils/api';
import '../styles/Profile.css';
import '../styles/UserProfile.css';

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

  const reportUser = async () => {
    const reasons = { '1': 'spam', '2': 'neprikladan_sadrzaj', '3': 'uznemiravanje', '4': 'ostalo' };
    const choice = window.prompt(
      'Prijavi ovog korisnika. Razlog:\n1 - Spam\n2 - Neprikladan sadržaj\n3 - Uznemiravanje\n4 - Ostalo\n\nUnesi broj (1-4):'
    );
    if (!choice) return;
    const reason = reasons[choice.trim()];
    if (!reason) { alert('Nevažeći izbor.'); return; }
    const details = window.prompt('Dodatni opis (opciono):') || '';
    try {
      await authenticatedFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({ reported_user_id: id, reason, details }),
      });
      alert('Prijava je poslata. Hvala što pomažeš da zajednica bude bezbedna.');
    } catch (err) {
      alert(`Greška: ${err.message}`);
    }
  };

  const blockUser = async () => {
    if (!window.confirm('Blokiraj ovog korisnika? Nećeš više videti njegove rute, niti će vas dvoje moći da se pratite.')) return;
    try {
      await authenticatedFetch(`/users/${id}/block`, { method: 'POST' });
      alert('Korisnik je blokiran.');
      setUser((prev) => ({ ...prev, is_following: false }));
    } catch (err) {
      alert(`Greška: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="pf-page" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="loading-spinner-modern" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="pf-page">
        <div className="pf-inner">
          <p className="pf-greet">Profil</p>
          <h1 className="pf-h1">Greška</h1>
          <div className="pf-card">
            <p style={{ color: 'var(--muted)', margin: '0 0 1rem' }}>{error || 'Korisnik nije pronađen.'}</p>
            <Link to="/routes" className="pf-btn-ghost" style={{ display: 'inline-block' }}>
              ← Nazad na rute
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const location = [user.city, user.country].filter((v) => v && v !== 'Unknown').join(', ');

  return (
    <div className="pf-page">
      <div className="pf-inner">
        <p className="pf-greet">Profil planinara</p>
        <h1 className="pf-h1">
          {user.name}
          {user.is_me && <span className="up-me-tag"> (ti)</span>}
        </h1>

        {/* profile header card */}
        <div className="pf-card pf-profile">
          <div className="pf-avatar">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.name} />
              : (user.name || '?').trim().charAt(0).toUpperCase()}
          </div>
          <div className="pf-profile__info">
            <h2 className="pf-profile__name">{user.name}</h2>
            {location && <p className="pf-profile__loc">📍 {location}</p>}

            {!user.is_me && user.is_following !== undefined && (
              <div className="up-actions">
                <button
                  type="button"
                  className={`up-btn ${user.is_following ? 'up-btn--following' : 'up-btn--follow'}`}
                  onClick={toggleFollow}
                >
                  {user.is_following ? 'Otprati' : 'Prati'}
                </button>
                <button type="button" className="up-btn up-btn--muted" onClick={reportUser}>
                  ⚠️ Prijavi
                </button>
                <button type="button" className="up-btn up-btn--danger" onClick={blockUser}>
                  🚫 Blokiraj
                </button>
              </div>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="pf-stats">
          <div className="pf-stat">
            <div className="pf-stat__value pf-stat__value--green">{(user.total_distance || 0).toFixed(1)}</div>
            <div className="pf-stat__label">km prepešačeno</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat__value">{formatDuration(user.total_duration || 0)}</div>
            <div className="pf-stat__label">Vreme u prirodi</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat__value">{user.routes_count || 0}</div>
            <div className="pf-stat__label">Ruta</div>
          </div>
        </div>

        {/* routes */}
        <div className="pf-card">
          <h3 className="pf-card-title">Rute ovog planinara</h3>

          {!user.routes || user.routes.length === 0 ? (
            <p className="pf-empty">Ovaj korisnik još uvek nije podelio nijednu rutu.</p>
          ) : (
            <div className="pf-routes">
              {user.routes.map((route) => (
                <Link key={route.id} to={`/route/${route.id}`} className="pf-route">
                  {route.thumbnail_url && <img src={route.thumbnail_url} alt={route.title} loading="lazy" />}
                  <div className="pf-route__body">
                    <div className="pf-route__title">{route.title}</div>
                    <div className="pf-route__sub">
                      {Number(route.distance || 0).toFixed(2)} km · {route.duration || 0} min · {route.points_count || 0} tačaka
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/routes" className="pf-btn-ghost" style={{ display: 'inline-block' }}>
          ← Nazad na rute
        </Link>
      </div>
    </div>
  );
};
