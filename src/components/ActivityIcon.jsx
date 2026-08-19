import React from 'react';

/* Pešak (Material „directions_walk", filled — nasleđuje currentColor). */
export const HikerIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <circle cx="13.5" cy="3.5" r="2" />
    <path d="M9.8 8.9 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
  </svg>
);

/* Biciklista (Lucide bike). */
export const BikeIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5 V14 l-3 -3 4 -3 2 3 h2" />
  </svg>
);

/** Ikonica aktivnosti po tipu: "bike" → biciklista, inače planinar (hike default). */
export default function ActivityIcon({ type, size = 20 }) {
  return type === 'bike' ? <BikeIcon size={size} /> : <HikerIcon size={size} />;
}
