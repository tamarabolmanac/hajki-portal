import React from 'react';

/* Planinar sa štapom (stroke, nasleđuje currentColor). */
export const HikerIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="13" cy="4" r="1.7" />
    <path d="M13 6.5 L11 12 L8.5 17.5" />
    <path d="M11 12 L14 14.5 L14.5 19.5" />
    <path d="M13 8 L16 9.6" />
    <path d="M12 8.5 L9 10.4" />
    <path d="M8.6 6 L8.6 15" />
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
