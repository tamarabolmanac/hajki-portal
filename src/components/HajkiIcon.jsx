import React from 'react';

/** App icon mark (Figma): dark tile, green mountain with topo lines, orange GPS pin. */
export default function HajkiIcon({ size = 512, rounded = true, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx={rounded ? 112 : 0} fill="#0C1410" />
      <radialGradient id="hjkGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#50C878" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#50C878" stopOpacity="0" />
      </radialGradient>
      <rect width="512" height="512" rx={rounded ? 112 : 0} fill="url(#hjkGlow)" />
      <defs>
        <clipPath id="hjkMtn"><path d="M 58,408 L 172,232 L 222,155 L 330,218 L 458,408 Z" /></clipPath>
      </defs>
      <path d="M 58,408 L 172,232 L 222,155 L 330,218 L 458,408 Z" fill="#50C878" fillOpacity="0.92" />
      <g clipPath="url(#hjkMtn)" stroke="#0C1410" strokeOpacity="0.28" fill="none" strokeWidth="5.5" strokeLinecap="round">
        <path d="M 195,208 Q 240,188 308,222" />
        <path d="M 148,272 Q 200,248 268,260 Q 325,272 392,302" />
        <path d="M 104,338 Q 172,310 258,322 Q 340,334 422,360" />
      </g>
      <path d="M 172,232 L 222,155 L 330,218" stroke="#50C878" strokeWidth="3" strokeOpacity="0.5" fill="none" strokeLinejoin="round" />
      <path d="M 222,155 C 205,140 196,120 196,102 C 196,79 208,62 222,62 C 236,62 248,79 248,102 C 248,120 239,140 222,155 Z" fill="#F5A623" />
      <circle cx="222" cy="100" r="13" fill="#0C1410" />
      <ellipse cx="258" cy="410" rx="185" ry="10" fill="#000" fillOpacity="0.18" />
    </svg>
  );
}
