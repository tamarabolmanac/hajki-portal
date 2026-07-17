import React from 'react';

/**
 * Hajki logo mark — detailed line-art peaks with a crossing trail, matching the
 * app icon and the default route thumbnail. Inherits color via currentColor.
 * Paths live in a 1024 coordinate space; the viewBox frames + centers them.
 */
export default function HajkiMark({ size = 24, strokeWidth = 26, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="219 219 586 586"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g transform="translate(0,83)">
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
