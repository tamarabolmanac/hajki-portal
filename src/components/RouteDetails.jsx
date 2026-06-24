import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/RouteDetails.css';
import '../styles/RouteDetail.css';
import { authenticatedFetch } from '../utils/api';
import { getCurrentUserID } from '../utils/authHandler';
import ElevationMap from './ElevationMap';
import AppLoader from './AppLoader';
import ConfirmModal from './ConfirmModal';
import { TagBadges } from './TagDisplay';

const MapPlaceholder = () => (
  <div className="map-placeholder">
    <div className="loading-spinner-modern" />
    <p style={{ marginTop: '0.75rem', color: '#9aa5a0', fontWeight: 500 }}>Učitavanje mape...</p>
  </div>
);

const formatDuration = (minutes) => {
  const h = Math.floor((minutes || 0) / 60);
  const m = (minutes || 0) % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');

const diffMeta = (d) => {
  const v = (d || '').toLowerCase();
  if (v.includes('hard') || v.includes('teš') || v.includes('tes')) return { cls: 'hard', label: 'Teško' };
  if (v.includes('eas') || v.includes('lak')) return { cls: 'easy', label: 'Lako' };
  return { cls: 'mid', label: 'Srednje' };
};

// icons
const IcClock = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
const IcRoute = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M6 17V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4" /></svg>);
const IcUp = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17l6-6 4 4 6-7" /><path d="M20 8h-4M20 8v4" /></svg>);

export const RouteDetails = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [gain, setGain] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const isRouteOwner = () => {
    if (!route) return false;
    // Backend computes ownership from the authenticated user — most reliable.
    if (typeof route.is_owner === 'boolean') return route.is_owner;
    // Fallback: compare local user id against the route's user_id / author id.
    const mine = currentUserID != null ? String(currentUserID) : null;
    return !!mine && (mine === String(route.user_id) || mine === String(route.author?.id));
  };

  useEffect(() => { setCurrentUserID(getCurrentUserID()); }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await authenticatedFetch(`/routes/${id}`);
        setRoute(data.data);
        if (data.data.points?.length > 0) {
          setRoutePoints(data.data.points.map((p) => ({ lat: p.lat, lng: p.lng })));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Elevation gain (visinska razlika) from the enriched profile.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await authenticatedFetch(`/routes/${id}/elevation`);
        if (cancelled || !Array.isArray(data.data)) return;
        const eles = data.data.filter((p) => p.elevation != null);
        if (eles.length < 2) return;
        let g = 0;
        for (let i = 1; i < eles.length; i++) {
          const d = eles[i].elevation - eles[i - 1].elevation;
          if (d > 0) g += d;
        }
        setGain(Math.round(g));
      } catch { /* keep gain null */ }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const isValidCoordinates = route &&
    !isNaN(route.location_latitude) && !isNaN(route.location_longitude) &&
    Number(route.location_latitude) >= -90 && Number(route.location_latitude) <= 90 &&
    Number(route.location_longitude) >= -180 && Number(route.location_longitude) <= 180;

  if (error) {
    return (
      <div className="rd-page" style={{ padding: 'var(--app-page-content-top, 120px) 24px 40px' }}>
        <h2>Greška</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
      </div>
    );
  }

  if (loading || !route) {
    return (
      <div className="rd-page" style={{ display: 'grid', placeItems: 'center' }}>
        <AppLoader title="Učitavanje detalja rute..." />
      </div>
    );
  }

  const center = { lat: Number(route.location_latitude), lng: Number(route.location_longitude) };
  const diff = diffMeta(route.difficulty);
  const heroImg = route.image_urls && route.image_urls[0];
  const hasMap = routePoints.length > 0 || isValidCoordinates;
  const canNavigate = routePoints.length > 1 || isValidCoordinates;

  const handleStartTracking = async () => {
    try {
      await authenticatedFetch(`/routes/${id}/start_tracking`, { method: 'POST' });
      setRoute((prev) => (prev ? { ...prev, status: 'tracking' } : prev));
      navigate(`/track-new-route/${id}`);
    } catch (e) {
      alert(e.message || 'Nije moguće pokrenuti snimanje rute.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authenticatedFetch(`/routes/${id}`, { method: 'DELETE' });
      navigate('/routes');
    } catch (err) {
      setDeleting(false);
      setShowDelete(false);
      alert(`Greška pri brisanju: ${err.message}`);
    }
  };

  const handleToggleLike = async () => {
    const liked = route.liked_by_current_user;
    setRoute((r) => ({ ...r, liked_by_current_user: !liked, likes_count: Math.max((r.likes_count || 0) + (liked ? -1 : 1), 0) }));
    try {
      const res = await authenticatedFetch(`/routes/${id}/like`, { method: liked ? 'DELETE' : 'POST' });
      setRoute((r) => ({ ...r, liked_by_current_user: res.data.liked_by_current_user, likes_count: res.data.likes_count }));
    } catch {
      setRoute((r) => ({ ...r, liked_by_current_user: liked, likes_count: Math.max((r.likes_count || 0) + (liked ? 1 : -1), 0) }));
    }
  };

  const handleToggleBookmark = async () => {
    const saved = route.bookmarked_by_current_user;
    setRoute((r) => ({ ...r, bookmarked_by_current_user: !saved }));
    try {
      await authenticatedFetch(`/routes/${id}/bookmark`, { method: saved ? 'DELETE' : 'POST' });
    } catch {
      setRoute((r) => ({ ...r, bookmarked_by_current_user: saved }));
    }
  };

  const handleReportRoute = async () => {
    const reasons = { '1': 'spam', '2': 'neprikladan_sadrzaj', '3': 'uznemiravanje', '4': 'netacne_informacije', '5': 'ostalo' };
    const choice = window.prompt('Prijavi rutu. Razlog:\n1 - Spam\n2 - Neprikladan sadržaj\n3 - Uznemiravanje\n4 - Netačne informacije\n5 - Ostalo\n\nUnesi broj (1-5):');
    if (!choice) return;
    const reason = reasons[choice.trim()];
    if (!reason) { alert('Nevažeći izbor.'); return; }
    const details = window.prompt('Dodatni opis (opciono):') || '';
    try {
      await authenticatedFetch('/reports', { method: 'POST', body: JSON.stringify({ hike_route_id: id, reason, details }) });
      alert('Prijava je poslata. Hvala što pomažeš da zajednica bude bezbedna.');
    } catch (err) {
      alert(`Greška: ${err.message}`);
    }
  };

  const Avatar = ({ author, big }) => (
    <span className={`rd-avatar ${big ? 'rd-avatar--lg' : ''}`}>
      {author?.avatar_url
        ? <img src={author.avatar_url} alt={author.name} />
        : (author?.name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );

  return (
    <div className="rd-page">
      {/* hero */}
      <div className="rd-hero">
        {heroImg
          ? <img className="rd-hero__img" src={heroImg} alt={route.title} />
          : (
            <div className="rd-hero__img rd-hero__noimg" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="72" height="72"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
            </div>
          )}
        <div className="rd-hero__overlay" />
        <button className="rd-back" onClick={() => navigate('/routes')}>← Nazad</button>
        <div className="rd-hero__content">
          <span className={`rd-badge rd-badge--${diff.cls}`}>{diff.label}</span>
          <h1 className="rd-title">{route.title}</h1>
          {route.author && (
            <div className="rd-hero__author">
              <Avatar author={route.author} />
              <span>{route.author.name}</span>
              {fmtDate(route.created_at) && <><span className="rd-dot">·</span><span>{fmtDate(route.created_at)}</span></>}
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div className="rd-body">
        <div className="rd-main">
          <div className="rd-stats">
            <div className="rd-stat">
              <div className="rd-stat__label"><IcClock /> Trajanje</div>
              <div className="rd-stat__value">{formatDuration(route.duration)}</div>
            </div>
            <div className="rd-stat">
              <div className="rd-stat__label"><IcRoute /> Dužina</div>
              <div className="rd-stat__value">{route.distance} km</div>
            </div>
            <div className="rd-stat">
              <div className="rd-stat__label"><IcUp /> Visinska razlika</div>
              <div className="rd-stat__value">{gain != null ? `${gain} m` : '—'}</div>
            </div>
          </div>

          {route.description && (
            <section className="rd-section">
              <h2 className="rd-section__title">O ruti</h2>
              <p className="rd-desc">{route.description}</p>
            </section>
          )}

          {route.tags && route.tags.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section__title">Karakteristike mesta</h2>
              <TagBadges tags={route.tags} />
            </section>
          )}

          {route.image_urls && route.image_urls.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section__title">Galerija</h2>
              <div className="rd-gallery">
                {route.image_urls.map((imageUrl, index) => {
                  const filename = imageUrl.split('/').pop().split('?')[0];
                  return <img key={index} src={`https://cdn.hajki.com/${filename}`} alt={`Ruta ${index + 1}`} loading="lazy" />;
                })}
              </div>
            </section>
          )}

          <section className="rd-section">
            <h2 className="rd-section__title">Mapa</h2>
            <div className="rd-map">
              {hasMap
                ? <ElevationMap routeId={id} points={routePoints} center={isValidCoordinates ? center : null} />
                : <MapPlaceholder />}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="rd-side">
          {canNavigate && (
            <button className="rd-navbtn" onClick={() => navigate(`/routes/${id}/navigate`)}>
              ▶ Pokreni navigaciju
            </button>
          )}

          <div className="rd-actions">
            <button className={`rd-action ${route.liked_by_current_user ? 'is-on' : ''}`} onClick={handleToggleLike}>
              <span className="rd-heart">♥</span> {route.likes_count || 0}
            </button>
            <button className={`rd-action ${route.bookmarked_by_current_user ? 'is-saved' : ''}`} onClick={handleToggleBookmark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={route.bookmarked_by_current_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              {route.bookmarked_by_current_user ? 'Sačuvano' : 'Sačuvaj'}
            </button>
            {isRouteOwner() ? (
              <button className="rd-action" onClick={() => navigate(`/routes/${id}/edit`)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                Uredi
              </button>
            ) : (
              <button className="rd-action" onClick={handleReportRoute}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                Prijavi
              </button>
            )}
          </div>

          {isRouteOwner() && (
            <div className="rd-owner">
              <button onClick={handleStartTracking}>🔴 Snimi rutu</button>
              <button className="rd-danger" onClick={() => setShowDelete(true)}>🗑 Obriši</button>
            </div>
          )}

          {route.author && (
            <Link to={`/user/${route.author.id}`} className="rd-card rd-author-card">
              <div className="rd-card__label">Autor</div>
              <div className="rd-author-card__row">
                <Avatar author={route.author} big />
                <div>
                  <div className="rd-author-card__name">{route.author.name}</div>
                  <div className="rd-author-card__sub">Planinar</div>
                </div>
              </div>
            </Link>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Obriši rutu"
        message="Ova akcija je trajna i ne može se poništiti."
        detail={route.title ? `"${route.title}"` : null}
        confirmLabel={deleting ? 'Brisanje…' : 'Obriši'}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
};

export default RouteDetails;
