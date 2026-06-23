import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import RouteCard from './RouteCard';
import '../styles/Home.css';

const Mountain = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
);
const IcArrow = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>);
const IcMap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v14M15 6v14" /></svg>);
const IcUsers = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M3 21a6 6 0 0 1 12 0" /><path d="M16 5a3.5 3.5 0 0 1 0 7M22 21a6 6 0 0 0-5-5.9" /></svg>);
const IcAward = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></svg>);

const FEATURES = [
  { icon: IcMap, title: 'GPS Praćenje', desc: 'Snimaj svaku rutu u realnom vremenu sa preciznim GPS podacima.' },
  { icon: IcUsers, title: 'Zajednica', desc: 'Podeli svoje rute i avanture sa hiljadama planinara iz Srbije.' },
  { icon: IcAward, title: 'Dostignuća', desc: 'Osvajaj bedževe i prati napredak svojih planinarskih ciljeva.' },
];

const noop = () => {};

export const Home = () => {
  const [routes, setRoutes] = useState([]);

  // Popular routes — only if logged in (public visitors just see the landing).
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${config.apiUrl}/routes?page=1&per_page=6`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRoutes((data.data || []).slice(0, 6));
      } catch { /* skip section */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="hm-page">
      {/* hero */}
      <section className="hm-hero">
        <img className="hm-hero__img" src="/img/hike-landing.jpg" alt="" />
        <div className="hm-hero__ov" />
        <div className="hm-hero__c">
          <span className="hm-badge"><span className="dot" /> Dobrodošli</span>
          <h1 className="hm-h1">Vreme je za<br /><span className="g">bolje</span><br />planinarenje</h1>
          <p className="hm-lead">Otkrij prirodu, prati svoje rute, deli avanture</p>
          <p className="hm-sub">Hajki je tvoj savršen pratilac za planinske avanture. Prati svoje putanje, otkrivaj nova mesta i poveži se sa zajednicom planinara.</p>
          <div className="hm-cta-row">
            <Link to="/routes" className="hm-btn hm-btn--primary">Počni da istražuješ <IcArrow /></Link>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="hm-features">
        <div className="hm-features__in">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div className="hm-feat" key={title}>
              <div className="hm-feat__ic"><Icon /></div>
              <div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* popular routes */}
      {routes.length > 0 && (
        <section className="hm-section">
          <div className="hm-sec-head">
            <div>
              <p className="hm-kicker">Otkrijte Srbiju</p>
              <h2 className="hm-h2">Popularne rute</h2>
            </div>
            <Link to="/routes" className="hm-seeall">Sve rute →</Link>
          </div>
          <div className="route-card-grid">
            {routes.map((hike, i) => (
              <RouteCard key={hike.id} hike={hike} onToggleLike={noop} onToggleBookmark={noop} priority={i < 3} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="hm-cta">
        <h2>Spremi se za <span className="g">avanturu</span></h2>
        <p>Pridruži se zajednici planinara i počni da beležiš svoja istraživanja.</p>
        <Link to="/register" className="hm-btn hm-btn--primary" style={{ display: 'inline-flex' }}>Registruj se besplatno</Link>
      </section>

      {/* footer */}
      <footer className="hm-foot">
        <div className="hm-foot__in">
          <div className="hm-foot__logo"><Mountain /> Hajki</div>
          <p>© 2026 Hajki · Srbija</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
