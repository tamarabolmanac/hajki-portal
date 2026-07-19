import React from 'react';
import { BackgroundImage } from './BackgroundImage';
import { useT } from '../i18n/I18nProvider';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '2rem' }}>
    <h2 style={{
      fontSize: '1.15rem', fontWeight: 700,
      color: '#38ef7d', margin: '0 0 0.75rem',
    }}>
      {title}
    </h2>
    <div style={{ color: '#e8fdf2', fontSize: '0.95rem', lineHeight: 1.8 }}>
      {children}
    </div>
  </div>
);

const Em = ({ children }) => <strong style={{ color: '#38ef7d' }}>{children}</strong>;
const P = ({ children, last }) => (
  <p style={{ margin: last ? 0 : '0 0 0.5rem', color: '#98FB98' }}>{children}</p>
);
const Ul = ({ items }) => (
  <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
    {items.map((it, i) => (
      <li key={i}>{it.b ? <><strong>{it.b}</strong> {it.t}</> : it.t}</li>
    ))}
  </ul>
);

/* Both languages kept in sync here; `lang` from I18nProvider picks one. */
const CONTENT = {
  sr: {
    title: 'Politika privatnosti',
    updated: 'Poslednje ažuriranje: 29. maja 2026.',
    contact: 'Za pitanja:',
    sections: [
      { h: '1. Ko smo', body: (
        <>Hajki je aplikacija za planinare i ljubitelje prirode koja omogućava snimanje i deljenje planinskih ruta. Aplikaciju razvija i održava tim Hajki. Za sva pitanja u vezi sa privatnošću možete nas kontaktirati putem stranice <Em>hajki.com/contact</Em>.</>
      ) },
      { h: '2. Koji podaci se prikupljaju', body: (
        <>
          <P>Tokom korišćenja aplikacije prikupljamo sledeće podatke:</P>
          <Ul items={[
            { b: 'Podaci naloga:', t: 'ime, email adresa, grad, zemlja i profilna slika koje sami unosite.' },
            { b: 'GPS lokacija:', t: 'koordinate se prikupljaju tokom aktivnog snimanja rute. Lokacija se ne prati u pozadini bez vaše eksplicitne akcije.' },
            { b: 'Podaci o rutama:', t: 'GPS tačke, dužina, trajanje i slike ruta koje kreirate.' },
          ]} />
        </>
      ) },
      { h: '3. Kako koristimo podatke', body: (
        <Ul items={[
          { t: 'Prikaz vaših završenih ruta zajednici u okviru aplikacije.' },
          { t: 'Izračunavanje statistika: pređena kilometraža, vreme u prirodi, elevacija, broj ruta.' },
          { t: 'Prikaz ruta u blizini vaše lokacije.' },
          { t: 'Slanje email poruka vezanih za nalog (potvrda registracije, reset lozinke).' },
        ]} />
      ) },
      { h: '4. Lokacijski podaci', body: (
        <>
          <P>Aplikacija koristi GPS isključivo tokom aktivnog snimanja rute — <strong>nikada u pozadini</strong> bez vaše akcije. Pre prvog korišćenja, aplikacija će zatražiti vašu dozvolu za pristup lokaciji.</P>
          <P last>GPS koordinate koje snimite tokom rute čuvaju se na našim serverima. Završene rute su vidljive drugim korisnicima aplikacije. Možete obrisati bilo koju svoju rutu u bilo kom trenutku, čime se brišu i njeni GPS podaci.</P>
        </>
      ) },
      { h: '5. Deljenje podataka', body: (
        <>
          <P>Vaše podatke ne prodajemo trećim stranama. Podaci se dele samo u sledećim slučajevima:</P>
          <Ul items={[
            { b: 'Servisi mapa:', t: 'koordinate se prosleđuju radi prikaza mape (Google Maps, OpenFreeMap/OpenStreetMap).' },
            { b: 'Google OAuth:', t: 'ako se registrujete putem Google naloga, primamo vaše ime i email od Google-a.' },
            { b: 'Zakonska obaveza:', t: 'ako to zahteva zakon ili nadležni organ.' },
          ]} />
        </>
      ) },
      { h: '6. Čuvanje podataka', body: (
        <>Podaci se čuvaju na sigurnim serverima. Podaci naloga čuvaju se dok ne obrišete nalog. GPS podaci ruta čuvaju se dok ne obrišete rutu. Možete zatražiti brisanje svih vaših podataka slanjem zahteva na našu kontakt stranicu.</>
      ) },
      { h: '7. Vaša prava', body: (
        <Ul items={[
          { t: 'Pravo pristupa podacima koje čuvamo o vama.' },
          { t: 'Pravo na ispravku netačnih podataka.' },
          { t: 'Pravo na brisanje naloga i svih povezanih podataka.' },
        ]} />
      ) },
      { h: '8. Bezbednost', body: (
        <>Koristimo JWT autentifikaciju, HTTPS enkripciju za sve komunikacije i bezbedan pristup bazi podataka. Lozinke se nikada ne čuvaju u originalnom obliku.</>
      ) },
      { h: '9. Deca', body: (
        <>Aplikacija nije namenjena deci mlađoj od 13 godina. Ne prikupljamo namerno podatke od dece.</>
      ) },
      { h: '10. Izmene politike privatnosti', body: (
        <>O svim značajnim izmenama ove politike obavestićemo vas putem email adrese registrovane u aplikaciji ili putem obaveštenja u samoj aplikaciji.</>
      ) },
    ],
  },

  en: {
    title: 'Privacy policy',
    updated: 'Last updated: May 29, 2026',
    contact: 'Questions:',
    sections: [
      { h: '1. Who we are', body: (
        <>Hajki is an app for hikers and nature lovers that lets you record and share hiking routes. The app is developed and maintained by the Hajki team. For any privacy-related questions, contact us via <Em>hajki.com/contact</Em>.</>
      ) },
      { h: '2. What data we collect', body: (
        <>
          <P>While you use the app we collect the following data:</P>
          <Ul items={[
            { b: 'Account data:', t: 'name, email address, city, country and profile picture that you provide yourself.' },
            { b: 'GPS location:', t: 'coordinates are collected while you are actively recording a route. Your location is never tracked in the background without your explicit action.' },
            { b: 'Route data:', t: 'GPS points, distance, duration and photos of the routes you create.' },
          ]} />
        </>
      ) },
      { h: '3. How we use the data', body: (
        <Ul items={[
          { t: 'Showing your finished routes to the community inside the app.' },
          { t: 'Calculating statistics: distance covered, time in nature, elevation, number of routes.' },
          { t: 'Showing routes near your location.' },
          { t: 'Sending account-related emails (registration confirmation, password reset).' },
        ]} />
      ) },
      { h: '4. Location data', body: (
        <>
          <P>The app uses GPS only while you are actively recording a route — <strong>never in the background</strong> without your action. Before first use, the app will ask for your permission to access location.</P>
          <P last>GPS coordinates recorded during a route are stored on our servers. Finished routes are visible to other users of the app. You can delete any of your routes at any time, which also deletes their GPS data.</P>
        </>
      ) },
      { h: '5. Data sharing', body: (
        <>
          <P>We do not sell your data to third parties. Data is shared only in the following cases:</P>
          <Ul items={[
            { b: 'Map services:', t: 'coordinates are passed along to render maps (Google Maps, OpenFreeMap/OpenStreetMap).' },
            { b: 'Google OAuth:', t: 'if you sign up with a Google account, we receive your name and email from Google.' },
            { b: 'Legal obligation:', t: 'if required by law or a competent authority.' },
          ]} />
        </>
      ) },
      { h: '6. Data retention', body: (
        <>Data is stored on secure servers. Account data is kept until you delete your account. Route GPS data is kept until you delete the route. You can request deletion of all your data via our contact page.</>
      ) },
      { h: '7. Your rights', body: (
        <Ul items={[
          { t: 'The right to access the data we hold about you.' },
          { t: 'The right to correct inaccurate data.' },
          { t: 'The right to delete your account and all associated data.' },
        ]} />
      ) },
      { h: '8. Security', body: (
        <>We use JWT authentication, HTTPS encryption for all communication and secure database access. Passwords are never stored in plain text.</>
      ) },
      { h: '9. Children', body: (
        <>The app is not intended for children under 13. We do not knowingly collect data from children.</>
      ) },
      { h: '10. Changes to this policy', body: (
        <>We will notify you of any significant changes to this policy via the email address registered in the app or through an in-app notification.</>
      ) },
    ],
  },
};

const PrivacyPolicy = () => {
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
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
            {c.updated}
          </p>
        </div>

        <div className="glass-card">
          {c.sections.map((s) => (
            <Section key={s.h} title={s.h}>{s.body}</Section>
          ))}

          <div style={{
            marginTop: '2rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem'
          }}>
            {c.contact} <Em>hajki.com/contact</Em>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
