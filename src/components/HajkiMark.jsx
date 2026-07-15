import React from 'react';

/**
 * Simplified line version of the Hajki logo mark (mountains + trail, no
 * wordmark). Inherits color via currentColor so each context can tint it.
 */
export default function HajkiMark({ size = 24, strokeWidth = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 19h19" />
      <path d="M4.5 19 9.5 10.5 14 19" />
      <path d="M9.5 19 14.5 4.5 20 19" />
    </svg>
  );
}
