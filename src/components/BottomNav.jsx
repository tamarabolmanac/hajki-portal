import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import recordingGuard from '../utils/recordingGuard';
import '../styles/BottomNav.css';

const IcHome = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>);
const IcCompass = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>);
const IcPlus = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
const IcUser = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);

const TABS = [
  { key: 'home', label: 'Početna', path: '/', icon: IcHome, match: (p) => p === '/' },
  { key: 'explore', label: 'Istraži', path: '/routes', icon: IcCompass, match: (p) => p.startsWith('/routes') || p.startsWith('/route/') },
  { key: 'add', label: 'Dodaj', path: '/new-route', icon: IcPlus, accent: true, match: (p) => p.startsWith('/new-route') || p.startsWith('/track-new-route') },
  { key: 'nalog', label: 'Nalog', path: '/profile', icon: IcUser, match: (p) => p.startsWith('/profile') },
];

const HIDE_ON = ['/login', '/register', '/forgot-password'];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // No bottom bar on auth screens or email-confirm flow.
  if (HIDE_ON.includes(pathname) || pathname.startsWith('/confirm')) return null;

  return (
    <nav className="bn">
      {TABS.map(({ key, label, path, icon: Icon, accent, match }) => {
        const active = match(pathname);
        return (
          <button
            key={key}
            type="button"
            className={`bn__tab ${accent ? 'bn__tab--accent' : ''} ${active ? 'is-active' : ''}`}
            onClick={() => recordingGuard.tryLeave(() => navigate(path))}
          >
            <span className={accent ? 'bn__accent' : 'bn__icon'}><Icon /></span>
            <span className="bn__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
