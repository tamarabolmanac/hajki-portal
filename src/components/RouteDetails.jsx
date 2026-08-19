import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/RouteDetails.css';
import '../styles/RouteDetail.css';
import { authenticatedFetch } from '../utils/api';
import { getCurrentUserID } from '../utils/authHandler';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import ElevationMap from './ElevationMap';
import AppLoader from './AppLoader';
import ConfirmModal from './ConfirmModal';
import { TagBadges } from './TagDisplay';
import ImageLightbox from './ImageLightbox';
import HajkiMark from './HajkiMark';
import ActivityIcon from './ActivityIcon';
import { getPendingSyncStatus, getPendingPointsForRoute } from '../tracking/nativeTracker';
import { useT } from '../i18n/I18nProvider';

// Gallery thumbnails reconstruct a stable cdn.hajki.com URL from the filename.
const cdnImageUrl = (url) => `https://cdn.hajki.com/${url.split('/').pop().split('?')[0]}`;

/** Ukupna distanca (km) preko tačaka, Haversine — za lokalni prikaz dok se ne sinhronizuje. */
const haversineKm = (pts) => {
  if (!pts || pts.length < 2) return 0;
  const R = 6371;
  let km = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    km += 2 * R * Math.asin(Math.sqrt(h));
  }
  return km;
};

const RD_DIFF = { hard: 'diff.hard', easy: 'diff.easy', mid: 'diff.medium' };

const MapPlaceholder = () => {
  const { t } = useT();
  return (
    <div className="map-placeholder">
      <div className="loading-spinner-modern" />
      <p style={{ marginTop: '0.75rem', color: '#9aa5a0', fontWeight: 500 }}>{t('rd.loadingMap')}</p>
    </div>
  );
};

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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  // Ruta ima neposlate (offline) tačke u lokalnoj bazi → indikator + crtanje iz lokalne baze.
  const [pendingLocal, setPendingLocal] = useState(false);
  const [localDistanceKm, setLocalDistanceKm] = useState(null);
  const { t } = useT();
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
        if (!data?.data) {
          // Ruta više ne postoji (npr. obrisana pa "back") — 404 vrati telo bez .data.
          // Ne rušimo render; prikažemo mirnu poruku umesto "Cannot read properties of undefined".
          setError(t('rd.notFound'));
          return;
        }
        setRoute(data.data);

        // Serverske tačke (sinhronizovane)
        let pts = (data.data.points || []).map((p) => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp }));

        // Native: dopuni neposlatim tačkama iz lokalne baze da se vidi CELA putanja
        // dok se ne sinhronizuje (server ih još nema). Union + hronološko sortiranje.
        if (Capacitor.isNativePlatform()) {
          try {
            const status = await getPendingSyncStatus();
            const isPending = status.routeIds.includes(String(id)) || status.finalizeIds.includes(String(id));
            if (isPending) {
              const local = await getPendingPointsForRoute(id);
              const seen = new Set(pts.map((p) => `${p.lat},${p.lng},${p.timestamp}`));
              for (const p of local) {
                const key = `${p.lat},${p.lng},${p.timestamp}`;
                if (!seen.has(key)) { pts.push({ lat: p.lat, lng: p.lng, timestamp: p.timestamp }); seen.add(key); }
              }
              pts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
              setPendingLocal(true);
              setLocalDistanceKm(haversineKm(pts));
            }
          } catch { /* lokalne tačke nisu presudne — nastavi sa serverskim */ }
        }

        if (pts.length > 0) {
          setRoutePoints(pts.map((p) => ({ lat: p.lat, lng: p.lng })));
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
      <div className="rd-page" style={{ display: 'grid', placeItems: 'center', padding: 'var(--app-page-content-top, 120px) 24px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ opacity: 0.4, marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <HajkiMark size={64} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate('/routes')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.7rem 1.4rem', borderRadius: 14,
              background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.4)',
              color: '#cbf7dd', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t('rd.back')}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !route) {
    return (
      <div className="rd-page" style={{ display: 'grid', placeItems: 'center' }}>
        <AppLoader title={t('rd.loadingDetail')} />
      </div>
    );
  }

  const center = { lat: Number(route.location_latitude), lng: Number(route.location_longitude) };
  const diff = diffMeta(route.difficulty);
  const heroImg = route.image_urls && route.image_urls[0];
  const galleryImages = (route.image_urls || []).map(cdnImageUrl);
  const hasMap = routePoints.length > 0 || isValidCoordinates;
  const canNavigate = routePoints.length > 1 || isValidCoordinates;

  const handleStartTracking = async () => {
    try {
      await authenticatedFetch(`/routes/${id}/start_tracking`, { method: 'POST' });
      setRoute((prev) => (prev ? { ...prev, status: 'tracking' } : prev));
      navigate(`/track-new-route/${id}`);
    } catch (e) {
      alert(e.message || t('rd.startErr'));
    }
  };

  const handleAddWaypoint = async ({ kind, label, lat, lng }) => {
    const data = await authenticatedFetch(`/routes/${id}/waypoints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, label, lat, lng }),
    });
    const wp = data?.data;
    if (wp) setRoute((prev) => (prev ? { ...prev, waypoints: [...(prev.waypoints || []), wp] } : prev));
  };

  const handleDeleteWaypoint = async (wpId) => {
    await authenticatedFetch(`/routes/${id}/waypoints/${wpId}`, { method: 'DELETE' });
    setRoute((prev) => (prev ? { ...prev, waypoints: (prev.waypoints || []).filter((w) => w.id !== wpId) } : prev));
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
    const choice = window.prompt(t('report.routePrompt'));
    if (!choice) return;
    const reason = reasons[choice.trim()];
    if (!reason) { alert(t('report.invalid')); return; }
    const details = window.prompt(t('report.details')) || '';
    try {
      await authenticatedFetch('/reports', { method: 'POST', body: JSON.stringify({ hike_route_id: id, reason, details }) });
      alert(t('report.sent'));
    } catch (err) {
      alert(`${t('report.errorPrefix')}${err.message}`);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://hajki.com/route/${id}`;
    const title = route.title || 'Hajki ruta';
    const text = `${title} — ${route.distance ? `${route.distance} km` : 'planinarska ruta'} na Hajki`;
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({ title, text, url: shareUrl, dialogTitle: t('rd.shareVia') });
      } else if (navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('rd.linkCopied'));
      }
    } catch (err) {
      // User closed the share sheet — not an error.
      if (err?.name === 'AbortError' || /cancel/i.test(err?.message || '')) return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert(t('rd.linkCopied'));
      } catch { /* clipboard unavailable */ }
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
          ? <img className="rd-hero__img rd-hero__img--zoom" src={heroImg} alt={route.title} onClick={() => galleryImages.length && setLightboxIndex(0)} />
          : (
            <div className="rd-hero__img rd-hero__noimg" aria-hidden="true">
              <HajkiMark size={72} />
            </div>
          )}
        <div className="rd-hero__overlay" />
        <button className="rd-back" onClick={() => navigate('/routes')}>{t('rd.back')}</button>
        <div className="rd-hero__content">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`rd-badge rd-badge--${diff.cls}`}>{t(RD_DIFF[diff.cls])}</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'rgba(56,239,125,0.15)', border: '1px solid rgba(56,239,125,0.4)',
              color: '#cbf7dd', borderRadius: '999px', padding: '0.2rem 0.6rem',
              fontSize: '0.8rem', fontWeight: 600,
            }}>
              <ActivityIcon type={route.activity_type} size={15} />
              {t(route.activity_type === 'bike' ? 'form.bike' : 'form.hike')}
            </span>
          </div>
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
          {pendingLocal && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(255,193,7,0.12)', border: '1px solid rgba(255,193,7,0.45)',
              borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem',
              color: '#ffe08a', fontSize: '0.88rem', lineHeight: 1.5,
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⏳</span>
              <span>{t('sync.notFullySynced')}</span>
            </div>
          )}
          <div className="rd-stats">
            <div className="rd-stat">
              <div className="rd-stat__label"><IcClock /> {t('rd.duration')}</div>
              <div className="rd-stat__value">{formatDuration(route.duration)}</div>
            </div>
            <div className="rd-stat">
              <div className="rd-stat__label"><IcRoute /> {t('rd.distance')}</div>
              <div className="rd-stat__value">
                {pendingLocal && localDistanceKm != null ? `~${localDistanceKm.toFixed(2)} km` : `${route.distance} km`}
              </div>
            </div>
            <div className="rd-stat">
              <div className="rd-stat__label"><IcUp /> {t('rd.elevation')}</div>
              <div className="rd-stat__value">{gain != null ? `${gain} m` : '—'}</div>
            </div>
          </div>

          {route.description && (
            <section className="rd-section">
              <h2 className="rd-section__title">{t('rd.about')}</h2>
              <p className="rd-desc">{route.description}</p>
            </section>
          )}

          {route.tags && route.tags.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section__title">{t('rd.features')}</h2>
              <TagBadges tags={route.tags} />
            </section>
          )}

          {route.image_urls && route.image_urls.length > 0 && (
            <section className="rd-section">
              <h2 className="rd-section__title">{t('rd.gallery')}</h2>
              <div className="rd-gallery">
                {galleryImages.map((imageUrl, index) => (
                  <button
                    type="button"
                    key={index}
                    className="rd-gallery__item"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Otvori sliku ${index + 1}`}
                  >
                    <img src={imageUrl} alt={`Ruta ${index + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rd-section">
            <h2 className="rd-section__title">{t('rd.map')}</h2>
            {isRouteOwner() && hasMap && <p className="rd-map-hint">📍 {t('wp.hint')}</p>}
            <div className="rd-map">
              {hasMap
                ? <ElevationMap
                    routeId={id}
                    points={routePoints}
                    center={isValidCoordinates ? center : null}
                    waypoints={route.waypoints || []}
                    editable={isRouteOwner()}
                    onAddWaypoint={handleAddWaypoint}
                    onDeleteWaypoint={handleDeleteWaypoint}
                  />
                : <MapPlaceholder />}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="rd-side">
          <div className="rd-navrow">
            {canNavigate && (
              <button className="rd-navbtn" onClick={() => navigate(`/routes/${id}/navigate`)}>
                {t('rd.startNav')}
              </button>
            )}
            <button
              className={`rd-action rd-action--like ${route.liked_by_current_user ? 'is-on' : ''}`}
              onClick={handleToggleLike}
            >
              <span className="rd-heart">♥</span> {route.likes_count || 0}
            </button>
          </div>

          <div className="rd-actions">
            <button className={`rd-action ${route.bookmarked_by_current_user ? 'is-saved' : ''}`} onClick={handleToggleBookmark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={route.bookmarked_by_current_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
              {route.bookmarked_by_current_user ? t('rd.saved') : t('rd.save')}
            </button>
            <button className="rd-action" onClick={handleShare}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2" /></svg>
              {t('rd.share')}
            </button>
            {isRouteOwner() ? (
              <button className="rd-action" onClick={() => navigate(`/routes/${id}/edit`)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                {t('rd.edit')}
              </button>
            ) : (
              <button className="rd-action" onClick={handleReportRoute}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                {t('rd.report')}
              </button>
            )}
          </div>

          {isRouteOwner() && (
            <div className="rd-owner">
              <button onClick={handleStartTracking}>{t('rd.record')}</button>
              <button className="rd-danger" onClick={() => setShowDelete(true)}>{t('rd.delete')}</button>
            </div>
          )}

          {route.author && (
            <Link to={`/user/${route.author.id}`} className="rd-card rd-author-card">
              <div className="rd-card__label">{t('rd.author')}</div>
              <div className="rd-author-card__row">
                <Avatar author={route.author} big />
                <div>
                  <div className="rd-author-card__name">{route.author.name}</div>
                  <div className="rd-author-card__sub">{t('rd.hiker')}</div>
                </div>
              </div>
            </Link>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={showDelete}
        title={t('rd.deleteTitle')}
        message={t('rd.deleteMsg')}
        detail={route.title ? `"${route.title}"` : null}
        confirmLabel={deleting ? t('rd.deleting') : t('rd.confirmDelete')}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <ImageLightbox
        images={galleryImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  );
};

export default RouteDetails;
