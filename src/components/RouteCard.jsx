import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/RouteCard.css';

const FALLBACK_IMG = '/img/routes-bgd.jpg';

const difficultyMeta = (d) => {
  const v = (d || '').toLowerCase();
  if (v.includes('hard') || v.includes('teš') || v.includes('tes')) return { cls: 'hard', label: 'Teško' };
  if (v.includes('eas') || v.includes('lak')) return { cls: 'easy', label: 'Lako' };
  return { cls: 'mid', label: 'Srednje' };
};

const fmtDate = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? '' : d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const IcClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const IcRoute = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M6 17V9a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4" /></svg>
);

/**
 * Route card matching the dark Figma card design. Self-contained styles
 * (RouteCard.css) so it doesn't touch the legacy `.hike-card` used elsewhere.
 */
export default function RouteCard({ hike, onToggleLike, onToggleBookmark, priority }) {
  const diff = difficultyMeta(hike.difficulty);
  const date = fmtDate(hike.created_at);

  return (
    <article className="route-card">
      <Link to={`/route/${hike.id}`} className="route-card__media">
        <img
          src={hike.thumbnail_url || FALLBACK_IMG}
          alt={hike.title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
        <span className={`route-card__badge route-card__badge--${diff.cls}`}>{diff.label}</span>
        <button
          type="button"
          className={`route-card__bookmark ${hike.bookmarked_by_current_user ? 'is-on' : ''}`}
          onClick={(e) => { e.preventDefault(); onToggleBookmark(hike.id, hike.bookmarked_by_current_user); }}
          aria-label={hike.bookmarked_by_current_user ? 'Ukloni iz sačuvanih' : 'Sačuvaj rutu'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={hike.bookmarked_by_current_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
        </button>
      </Link>

      <div className="route-card__body">
        <div className="route-card__meta">
          <div className="route-card__author">
            <span className="route-card__avatar">
              {hike.author?.avatar_url
                ? <img src={hike.author.avatar_url} alt={hike.author.name} loading="lazy" />
                : (hike.author?.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span className="route-card__author-name">{hike.author?.name || 'Nepoznat'}</span>
          </div>
          {date && <span className="route-card__date">{date}</span>}
        </div>

        <Link to={`/route/${hike.id}`} className="route-card__title">{hike.title}</Link>

        <div className="route-card__divider" />

        <div className="route-card__stats">
          {hike.duration != null && <span className="route-card__stat"><IcClock /> {hike.duration} min</span>}
          {hike.distance != null && <span className="route-card__stat"><IcRoute /> {hike.distance} km</span>}
          <button
            type="button"
            className={`route-card__like ${hike.liked_by_current_user ? 'is-on' : ''}`}
            onClick={() => onToggleLike(hike.id, hike.liked_by_current_user)}
            aria-pressed={!!hike.liked_by_current_user}
            aria-label={hike.liked_by_current_user ? 'Ukloni lajk' : 'Lajkuj rutu'}
          >
            <span aria-hidden="true">♥</span> {hike.likes_count || 0}
          </button>
        </div>
      </div>
    </article>
  );
}
