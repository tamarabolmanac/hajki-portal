import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { config } from '../config';
import RouteCard from './RouteCard';
import { useT } from '../i18n/I18nProvider';
import '../styles/Home.css';

const Mountain = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
);
const IcArrow = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>);
const IcMap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v14M15 6v14" /></svg>);
const IcUsers = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M3 21a6 6 0 0 1 12 0" /><path d="M16 5a3.5 3.5 0 0 1 0 7M22 21a6 6 0 0 0-5-5.9" /></svg>);
const IcTune = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="7" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="17" r="2" /></svg>);

const FEATURES = [
  { icon: IcMap, titleKey: 'home.feat_gps_t', descKey: 'home.feat_gps_d' },
  { icon: IcUsers, titleKey: 'home.feat_comm_t', descKey: 'home.feat_comm_d' },
  { icon: IcTune, titleKey: 'home.feat_tune_t', descKey: 'home.feat_tune_d' },
];

const noop = () => {};

export const Home = () => {
  const { t } = useT();
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
          <span className="hm-badge"><span className="dot" /> {t('home.badge')}</span>
          <h1 className="hm-h1">{t('home.h1_1')}<br /><span className="g">{t('home.h1_2')}</span></h1>
          <p className="hm-lead">{t('home.lead')}</p>
          <div className="hm-cta-row">
            <Link to="/routes" className="hm-btn hm-btn--primary">{t('home.cta_explore')} <IcArrow /></Link>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="hm-features">
        <div className="hm-features__in">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <div className="hm-feat" key={titleKey}>
              <div className="hm-feat__ic"><Icon /></div>
              <div>
                <h3>{t(titleKey)}</h3>
                <p>{t(descKey)}</p>
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
              <p className="hm-kicker">{t('home.kicker')}</p>
              <h2 className="hm-h2">{t('home.recent')}</h2>
            </div>
            <Link to="/routes" className="hm-seeall">{t('home.all_routes')}</Link>
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
        <h2>{t('home.cta_t1')} <span className="g">{t('home.cta_t2')}</span></h2>
        <p>{t('home.cta_sub')}</p>
        <Link to="/register" className="hm-btn hm-btn--primary" style={{ display: 'inline-flex' }}>{t('home.cta_register')}</Link>
      </section>

      {/* footer */}
      <footer className="hm-foot">
        <div className="hm-foot__in">
          <div className="hm-foot__logo"><Mountain /> Hajki</div>
          <p>{t('home.footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
