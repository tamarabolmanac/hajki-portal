import React, { useEffect, useState } from 'react';
import { useT } from '../i18n/I18nProvider';
import '../styles/SplashScreen.css';

/** Launch splash: topo bg, logo image (mark + HAJKI wordmark), tagline, progress bar. */
export default function SplashScreen({ onDone }) {
  const { t } = useT();
  const [progress, setProgress] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000;
    let raf;
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else { setOut(true); setTimeout(onDone, 400); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className={`splash ${out ? 'splash--out' : ''}`} onClick={onDone}>
      <svg className="splash__topo" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {[50, 100, 150, 200, 260, 325, 395, 470, 550].map((r, i) => (
          <ellipse key={i} cx="400" cy="300" rx={r} ry={r * 0.62} fill="none" stroke="#50C878" strokeWidth="1.2" />
        ))}
        {[35, 70, 105, 145, 190].map((r, i) => (
          <ellipse key={`b${i}`} cx="140" cy="140" rx={r * 0.8} ry={r * 0.55} fill="none" stroke="#50C878" strokeWidth="0.9" />
        ))}
      </svg>

      <img className="splash__logo" src="/img/hajki-logo.png" alt="Hajki" width="220" height="220" />
      <p className="splash__tag">{t('splash.tag')}</p>
      <div className="splash__bar"><div className="splash__fill" style={{ width: `${progress * 100}%` }} /></div>
    </div>
  );
}
