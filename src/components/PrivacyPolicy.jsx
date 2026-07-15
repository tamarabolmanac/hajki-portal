import React from 'react';
import { BackgroundImage } from './BackgroundImage';

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

const PrivacyPolicy = () => {
  const lastUpdated = '29. maja 2026.';

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
            Politika privatnosti
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
            Poslednje ažuriranje: {lastUpdated}
          </p>
        </div>

        <div className="glass-card">

          <Section title="1. Ko smo">
            Hajki je aplikacija za planinare i ljubitelje prirode koja omogućava snimanje i deljenje planinskih ruta. Aplikaciju razvija i održava tim Hajki. Za sva pitanja u vezi sa privatnošću možete nas kontaktirati putem stranice <strong style={{ color: '#38ef7d' }}>hajki.com/contact</strong>.
          </Section>

          <Section title="2. Koji podaci se prikupljaju">
            <p style={{ margin: '0 0 0.5rem', color: '#98FB98' }}>Tokom korišćenja aplikacije prikupljamo sledeće podatke:</p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
              <li><strong>Podaci naloga:</strong> ime, email adresa, grad, zemlja i profilna slika koje sami unosite.</li>
              <li><strong>GPS lokacija:</strong> koordinate se prikupljaju tokom aktivnog snimanja rute. Lokacija se ne prati u pozadini bez vaše eksplicitne akcije.</li>
              <li><strong>Podaci o rutama:</strong> GPS tačke, dužina, trajanje i slike ruta koje kreirate.</li>
              <li><strong>Tehnički podaci:</strong> tip uređaja, verzija operativnog sistema i anonimni podaci o greškama koji nam pomažu da poboljšamo aplikaciju.</li>
            </ul>
          </Section>

          <Section title="3. Kako koristimo podatke">
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>Prikaz i deljenje vaših ruta sa zajednicom (ukoliko to odaberete).</li>
              <li>Izračunavanje statistika: pređena kilometraža, vreme u prirodi, elevacija, broj ruta.</li>
              <li>Prikaz ruta u blizini vaše lokacije.</li>
              <li>Slanje email poruka vezanih za nalog (potvrda registracije, reset lozinke).</li>
              <li>Poboljšanje aplikacije na osnovu anonimizovanih podataka o korišćenju.</li>
            </ul>
          </Section>

          <Section title="4. Lokacijski podaci">
            <p style={{ margin: '0 0 0.5rem', color: '#98FB98' }}>
              Aplikacija koristi GPS isključivo tokom aktivnog snimanja rute — <strong>nikada u pozadini</strong> bez vaše akcije. Pre prvog korišćenja, aplikacija će zatražiti vašu dozvolu za pristup lokaciji.
            </p>
            <p style={{ margin: 0, color: '#98FB98' }}>
              GPS koordinate koje snimite tokom rute čuvaju se na našim serverima i, ako odaberete javni prikaz rute, postaju vidljive drugim korisnicima. Možete obrisati bilo koju rutu u bilo kom trenutku.
            </p>
          </Section>

          <Section title="5. Deljenje podataka">
            <p style={{ margin: '0 0 0.5rem', color: '#98FB98' }}>Vaše podatke ne prodajemo trećim stranama. Podaci se dele samo u sledećim slučajevima:</p>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li><strong>Google Maps:</strong> koordinate se prosleđuju radi prikaza mape (Google Maps API).</li>
              <li><strong>Google OAuth:</strong> ako se registrujete putem Google naloga, primamo vaše ime i email od Google-a.</li>
              <li><strong>Zakonska obaveza:</strong> ako to zahteva zakon ili nadležni organ.</li>
            </ul>
          </Section>

          <Section title="6. Čuvanje podataka">
            Podaci se čuvaju na sigurnim serverima. Podaci naloga čuvaju se dok ne obrišete nalog. GPS podaci ruta čuvaju se dok ne obrišete rutu. Možete zatražiti brisanje svih vaših podataka slanjem zahteva na našu kontakt stranicu.
          </Section>

          <Section title="7. Vaša prava">
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>Pravo pristupa podacima koje čuvamo o vama.</li>
              <li>Pravo na ispravku netačnih podataka.</li>
              <li>Pravo na brisanje naloga i svih povezanih podataka.</li>
              <li>Pravo na prenosivost podataka (izvoz vaših ruta).</li>
            </ul>
          </Section>

          <Section title="8. Bezbednost">
            Koristimo JWT autentifikaciju, HTTPS enkripciju za sve komunikacije i bezbedan pristup bazi podataka. Lozinke se nikada ne čuvaju u originalnom obliku.
          </Section>

          <Section title="9. Deca">
            Aplikacija nije namenjena deci mlađoj od 13 godina. Ne prikupljamo namerno podatke od dece.
          </Section>

          <Section title="10. Izmene politike privatnosti">
            O svim značajnim izmenama ove politike obavestićemo vas putem email adrese registrovane u aplikaciji ili putem obaveštenja u samoj aplikaciji.
          </Section>

          <div style={{
            marginTop: '2rem', paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem'
          }}>
            Za pitanja: <strong style={{ color: '#38ef7d' }}>hajki.com/contact</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
