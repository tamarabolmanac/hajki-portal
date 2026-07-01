import React, { useEffect, useCallback } from 'react';
import '../styles/ImageLightbox.css';

// Full-screen image preview. Controlled via `index` (null = closed).
// Props:
//   images        – array of image URLs
//   index         – currently shown index, or null when closed
//   onClose       – () => void
//   onIndexChange – (nextIndex) => void
const ImageLightbox = ({ images = [], index, onClose, onIndexChange }) => {
  const isOpen = index !== null && index !== undefined && images.length > 0;
  const count = images.length;
  const many = count > 1;

  const go = useCallback(
    (delta) => {
      if (!many) return;
      onIndexChange((index + delta + count) % count);
    },
    [index, count, many, onIndexChange]
  );

  // Keyboard: Esc closes, arrows navigate.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, go]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ilb-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <button className="ilb-close" onClick={onClose} aria-label="Zatvori">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {many && (
        <button
          className="ilb-nav ilb-nav--prev"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Prethodna"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}

      <figure className="ilb-stage" onClick={(e) => e.stopPropagation()}>
        <img className="ilb-img" src={images[index]} alt={`Slika ${index + 1}`} />
        {many && <figcaption className="ilb-counter">{index + 1} / {count}</figcaption>}
      </figure>

      {many && (
        <button
          className="ilb-nav ilb-nav--next"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Sledeća"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}
    </div>
  );
};

export default ImageLightbox;
