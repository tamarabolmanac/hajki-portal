import React from 'react';

/** App icon mark: dark tile, geometric line-art peaks with a crossing trail. */
export default function HajkiIcon({ size = 512, rounded = true, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" rx={rounded ? 224 : 0} fill="#0C120D" />
      <g
        transform="translate(0,83)"
        fill="none"
        stroke="#50C878"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M232,610 L792,610" />
        <path d="M232,610 L388,362 L470,493" />
        <path d="M516,248 L448,457" />
        <path d="M516,248 L648,610" />
        <path d="M516,248 L516,392" />
        <path d="M656,376 L560,610" />
        <path d="M656,376 L792,610" />
        <path d="M614,610 L658,524 L702,610" />
        <path d="M584,435 L268,596" />
      </g>
    </svg>
  );
}
