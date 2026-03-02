import React, { useState } from "react";

/**
 * Optimized background image with:
 * - Fade-in when loaded (smooth UX, no blank flash)
 * - fetchpriority for above-fold images
 * - Placeholder shown until load
 */
export const BackgroundImage = ({ src, alt = "", className = "", fetchPriority = "high" }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${loaded ? "bg-image-loaded" : ""}`}
      fetchPriority={fetchPriority}
      loading="eager"
      onLoad={() => setLoaded(true)}
    />
  );
};
