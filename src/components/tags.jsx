import React from 'react';

/**
 * Canonical place-characteristic tags — matches the Figma TAG_DEFINITIONS
 * (Serbian ids + labels + per-tag accent color). `key` is stored in the
 * backend (HikeRoute::ALLOWED_TAGS must match these ids).
 */
export const TAGS = [
  { key: 'kafic',     label: 'Kafić',            color: '#fbbf24' },
  { key: 'komarci',   label: 'Komarci',          color: '#fb923c' },
  { key: 'guzva',     label: 'Gužva',            color: '#60a5fa' },
  { key: 'vodopad',   label: 'Vodopad',          color: '#22d3ee' },
  { key: 'reka',      label: 'Reka',             color: '#93c5fd' },
  { key: 'jezero',    label: 'Jezero',           color: '#818cf8' },
  { key: 'vidikovac', label: 'Vidikovac',        color: '#c084fc' },
  { key: 'odmor',     label: 'Mesta za sedenje', color: '#4ade80' },
  { key: 'suma',      label: 'Šuma',             color: '#34d399' },
  { key: 'dostupno',  label: 'Lako dostupno',    color: '#50c878' },
  { key: 'vetrovito', label: 'Vetrovito',        color: '#94a3b8' },
  { key: 'parking',   label: 'Parking',          color: '#9ca3af' },
  { key: 'hrana',     label: 'Hrana',            color: '#facc15' },
  { key: 'blato',     label: 'Blato',            color: '#a8a29e' },
  { key: 'insekti',   label: 'Insekti',          color: '#84cc16' },
];

export const TAG_MAP = TAGS.reduce((acc, t) => { acc[t.key] = t; return acc; }, {});
export const TAG_LABELS = TAGS.reduce((acc, t) => { acc[t.key] = t.label; return acc; }, {});
export const TAG_KEYS = TAGS.map((t) => t.key);

/** Line icon per tag id (lucide-style, matching the design icon choices). */
export function TagIcon({ tag, size = 16, className }) {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
  };
  switch (tag) {
    case 'kafic': // Coffee
      return <svg {...c}><path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" /></svg>;
    case 'komarci': // Bug
    case 'insekti':
      return <svg {...c}><path d="m8 2 1.88 1.88M14.12 3.88 16 2" /><path d="M9 7.13v-1a3 3 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6Z" /><path d="M12 20v-9M6.5 10H2M21.5 10H18M6 19c-2 0-3-1-3-3M21 16c0 2-1 3-3 3" /></svg>;
    case 'guzva': // Users
      return <svg {...c}><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 6M22 20a6 6 0 0 0-4.5-5.8" /></svg>;
    case 'vodopad': // Droplets
      return <svg {...c}><path d="M7 16.3c2.2 0 4-1.8 4-4 0-1.2-.6-2.3-1.7-3.2C8.3 8.3 7.3 6.8 7 5.3c-.3 1.5-1.1 2.8-2.3 3.8S3 11.1 3 12.3c0 2.2 1.8 4 4 4Z" /><path d="M12.6 6.6A11 11 0 0 0 14 3c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 0 1-11.9 5" /></svg>;
    case 'reka': // Waves
      return <svg {...c}><path d="M2 7c.6.5 1.2 1 2.5 1C7 8 7 6 9.5 6c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2" /><path d="M2 13c.6.5 1.2 1 2.5 1C7 14 7 12 9.5 12c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2" /><path d="M2 19c.6.5 1.2 1 2.5 1C7 20 7 18 9.5 18c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2" /></svg>;
    case 'jezero': // Fish
      return <svg {...c}><path d="M6.5 12c.9-3.5 4.9-6 8.5-6 3.6 0 6.1 2.5 7 6-.9 3.5-3.4 6-7 6s-7.6-2.5-8.5-6Z" /><path d="M18 12v.5" /><path d="M7 10.7C7 8 5.6 6 2.7 5.5c-1 1.5-1 5 .2 6.5-1.2 1.5-1.2 5-.2 6.5C5.6 18 7 16 7 13.3" /></svg>;
    case 'vidikovac': // Eye
      return <svg {...c}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'odmor': // Armchair
      return <svg {...c}><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" /><path d="M3 11a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2 2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /><path d="M5 18v2M19 18v2" /></svg>;
    case 'suma': // TreePine
      return <svg {...c}><path d="M12 3 7 11h3l-4 6h12l-4-6h3Z" /><path d="M12 17v4" /></svg>;
    case 'dostupno': // Accessibility
      return <svg {...c}><circle cx="12" cy="4.5" r="1.5" /><path d="M6 8h12" /><path d="M9 8v5l-1.5 6M15 8v5l1.5 6" /></svg>;
    case 'vetrovito': // Wind
      return <svg {...c}><path d="M12.8 19.6A2 2 0 1 0 14 16H2" /><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" /><path d="M9.8 4.4A2 2 0 1 1 11 8H2" /></svg>;
    case 'parking': // Car
      return <svg {...c}><path d="M5 17H3v-4l2-5h11l2.5 3.5L21 12v5h-2" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /><path d="M9.5 17h5" /></svg>;
    case 'hrana': // Utensils
      return <svg {...c}><path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>;
    case 'blato': // CloudDrizzle
      return <svg {...c}><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M8 19v1M12 21v1M16 19v1" /></svg>;
    default:
      return <svg {...c}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

export default TagIcon;
