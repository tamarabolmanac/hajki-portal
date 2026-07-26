import React from 'react';
import { BackgroundImage } from './BackgroundImage';
import { useT } from '../i18n/I18nProvider';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38ef7d', margin: '0 0 0.75rem' }}>
      {title}
    </h2>
    <div style={{ color: '#e8fdf2', fontSize: '0.95rem', lineHeight: 1.8 }}>{children}</div>
  </div>
);

const Em = ({ children }) => <strong style={{ color: '#38ef7d' }}>{children}</strong>;

/* Public account-deletion instructions page (required by Google Play). Bilingual. */
const CONTENT = {
  sr: {
    title: 'Brisanje naloga',
    intro: 'Možeš u bilo kom trenutku obrisati svoj Hajki nalog i sve povezane podatke. Postoje dva načina:',
    inAppTitle: '1. Iz aplikacije',
    inApp: (
      <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
        <li>Otvori Hajki i prijavi se</li>
        <li>Idi na <strong>Nalog</strong> (Account)</li>
        <li>Na dnu izaberi <strong>Obriši nalog</strong></li>
        <li>Potvrdi klikom na link koji ti stigne na email</li>
      </ol>
    ),
    emailTitle: '2. Putem emaila',
    email: (
      <>Ako ne možeš da pristupiš aplikaciji, pošalji zahtev za brisanje naloga preko naše kontakt stranice <Em>hajki.com/contact</Em> sa email adrese svog naloga.</>
    ),
    whatTitle: 'Šta se briše',
    what: 'Brisanjem naloga trajno se uklanjaju: tvoji podaci naloga (ime, email, profilna slika), sve tvoje rute i GPS tačke, i sve tvoje fotografije. Ova akcija je nepovratna i podaci se ne mogu vratiti.',
    whenTitle: 'Kada',
    when: 'Nalog i svi povezani podaci brišu se odmah po potvrdi zahteva.',
  },
  en: {
    title: 'Account deletion',
    intro: 'You can delete your Hajki account and all associated data at any time. There are two ways:',
    inAppTitle: '1. From the app',
    inApp: (
      <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
        <li>Open Hajki and sign in</li>
        <li>Go to <strong>Account</strong></li>
        <li>At the bottom, choose <strong>Delete account</strong></li>
        <li>Confirm via the link sent to your email</li>
      </ol>
    ),
    emailTitle: '2. By email',
    email: (
      <>If you can't access the app, send an account deletion request via our contact page <Em>hajki.com/contact</Em> from your account's email address.</>
    ),
    whatTitle: 'What gets deleted',
    what: 'Deleting your account permanently removes: your account data (name, email, profile picture), all your routes and GPS points, and all your photos. This action is irreversible and the data cannot be recovered.',
    whenTitle: 'When',
    when: 'Your account and all associated data are deleted immediately once the request is confirmed.',
  },
};

const AccountDeletion = () => {
  const { lang } = useT();
  const c = CONTENT[lang] || CONTENT.sr;

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>

      <div className="page-container" style={{ maxWidth: 760 }}>
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem',
            background: 'linear-gradient(135deg, #ffffff, #f0fdf4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {c.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: 0 }}>{c.intro}</p>
        </div>

        <div className="glass-card">
          <Section title={c.inAppTitle}>{c.inApp}</Section>
          <Section title={c.emailTitle}>{c.email}</Section>
          <Section title={c.whatTitle}>{c.what}</Section>
          <Section title={c.whenTitle}>{c.when}</Section>

          <div style={{
            marginTop: '2rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem'
          }}>
            <Em>hajki.com/contact</Em>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
