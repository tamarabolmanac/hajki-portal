import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/I18nProvider';
import '../styles/AddChoose.css';

const IcCompass = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>);
const IcPencil = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>);

export const ChoseRouteCreationType = () => {
  const navigate = useNavigate();
  const { t } = useT();

  // Ne kreiramo rutu ovde — samo otvaramo tracker. Rekord rute se kreira tek
  // kada korisnik stvarno pritisne "Započni snimanje rute" (RouteTracker).
  const handleTrackRoute = () => navigate('/track-new-route/new');

  const handleCreateManually = () => navigate('/create-route-manual');

  return (
    <div className="ac-page">
      <div className="ac-inner">
        <p className="ac-kicker">{t('choose.kicker')}</p>
        <h1 className="ac-h1">{t('choose.title')}</h1>

        <div className="ac-card">
          <div className="ac-card__head">
            <div className="ac-card__ic ac-card__ic--green"><IcCompass /></div>
            <h2 className="ac-card__title">{t('choose.recordTitle')}</h2>
          </div>
          <p className="ac-card__desc">{t('choose.recordDesc')}</p>
          <button className="ac-btn ac-btn--primary" onClick={handleTrackRoute}>{t('choose.recordTitle')}</button>
        </div>

        <div className="ac-card">
          <div className="ac-card__head">
            <div className="ac-card__ic ac-card__ic--muted"><IcPencil /></div>
            <h2 className="ac-card__title">{t('choose.manualTitle')}</h2>
          </div>
          <p className="ac-card__desc">{t('choose.manualDesc')}</p>
          <button className="ac-btn ac-btn--ghost" onClick={handleCreateManually}>{t('choose.manualTitle')}</button>
        </div>
      </div>
    </div>
  );
};

export default ChoseRouteCreationType;
