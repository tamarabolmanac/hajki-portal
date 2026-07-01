import React from 'react';
import { TagIcon, TAG_MAP } from './tags';

// Marker kinds for route waypoints. Must match Waypoint::ALLOWED_KINDS on the
// backend. Shared ids reuse the tag color/icon; waypoint-only ids define their own.
export const WAYPOINT_KINDS = [
  { key: 'vidikovac', label: 'Vidikovac', color: TAG_MAP.vidikovac?.color || '#c084fc' },
  { key: 'izvor',     label: 'Izvor',     color: '#38bdf8' },
  { key: 'voda',      label: 'Voda',      color: '#22d3ee' },
  { key: 'vodopad',   label: 'Vodopad',   color: TAG_MAP.vodopad?.color || '#22d3ee' },
  { key: 'reka',      label: 'Reka',      color: TAG_MAP.reka?.color || '#93c5fd' },
  { key: 'jezero',    label: 'Jezero',    color: TAG_MAP.jezero?.color || '#818cf8' },
  { key: 'odmor',     label: 'Odmorište', color: TAG_MAP.odmor?.color || '#4ade80' },
  { key: 'suma',      label: 'Šuma',      color: TAG_MAP.suma?.color || '#34d399' },
  { key: 'pecina',    label: 'Pećina',    color: '#a78bfa' },
  { key: 'parking',   label: 'Parking',   color: TAG_MAP.parking?.color || '#9ca3af' },
  { key: 'hrana',     label: 'Hrana',     color: TAG_MAP.hrana?.color || '#facc15' },
  { key: 'kafic',     label: 'Kafić',     color: TAG_MAP.kafic?.color || '#fbbf24' },
  { key: 'opasnost',  label: 'Opasnost',  color: '#f87171' },
];

export const WAYPOINT_MAP = WAYPOINT_KINDS.reduce((acc, w) => { acc[w.key] = w; return acc; }, {});

// Icon per waypoint kind: reuse the tag icon for shared ids, else a dedicated one.
export function WaypointIcon({ kind, size = 16 }) {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (kind) {
    case 'izvor': // Droplet (spring)
      return <svg {...c}><path d="M12 2.7 6.8 9.3a7 7 0 1 0 10.4 0L12 2.7Z" /></svg>;
    case 'voda': // Glass / water
      return <svg {...c}><path d="M5 4h14l-1.5 16.2a1 1 0 0 1-1 .8H7.5a1 1 0 0 1-1-.8L5 4Z" /><path d="M5.5 10h13" /></svg>;
    case 'pecina': // Cave / arch
      return <svg {...c}><path d="M3 21v-7a9 9 0 0 1 18 0v7" /><path d="M12 21v-4a3 3 0 0 0-3 3v1" /></svg>;
    case 'opasnost': // Alert triangle
      return <svg {...c}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>;
    default:
      return <TagIcon tag={kind} size={size} />;
  }
}

export default WaypointIcon;
