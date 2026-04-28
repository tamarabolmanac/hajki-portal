import React from "react";
import "../styles/Guide.css";

export const Guide = () => {
  return (
    <div className="guide-container">
      <div className="guide-header">
        <h1>Kako koristiti Hajki aplikaciju</h1>
        <p>Vodič kroz sve funkcionalnosti - od registracije do deljenja tvojih planinskih avantura</p>
      </div>

      <div className="guide-content">
        <div className="guide-section">
          <div className="step-number">1</div>
          <div className="step-content">
            <h2>Registruj se</h2>
            <p>Kreiraj nalog da bi mogao da pratiš svoje rute i deliš iskustva sa drugim planinarima.</p>
            <div className="step-details">
              <h3>Koraci:</h3>
              <ul>
                <li>Klikni na "Registracija" u meniju</li>
                <li>Unesi email, lozinku i lične podatke</li>
                <li>Potvori email adresu</li>
                <li>Prijavi se na svoj nalog</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">2</div>
          <div className="step-content">
            <h2>Istraži postojeće rute</h2>
            <p>Pronađi inspiraciju među rutama koje su već delili drugi planinari.</p>
            <div className="step-details">
              <h3>Kako da pronađeš rute:</h3>
              <ul>
                <li>Klikni na "Pretraži rute" u meniju</li>
                <li>Koristi filtere za težinu, dužinu ili lokaciju</li>
                <li>Pogledaj detalje rute, slike i komentare</li>
                <li>Sačuvaj omiljene rute za kasnije</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">3</div>
          <div className="step-content">
            <h2>Kreiraj novu rutu</h2>
            <p>Deli svoju planinsku avanturu sa zajednicom - dva načina unosa rute.</p>
            <div className="step-details">
              <h3>Način 1: Ručni unos</h3>
              <ul>
                <li>Klikni na "Nova ruta" → "Ručni unos"</li>
                <li>Unesi naziv, opis i detalje rute</li>
                <li>Dodaj slike i GPS koordinate</li>
                <li>Označi težinu i procenjeno vreme</li>
              </ul>
              
              <h3>Način 2: Praćenje u realnom vremenu</h3>
              <ul>
                <li>Klikni na "Nova ruta" → "Prati putanju"</li>
                <li>Dozvoli lokaciju na telefonu</li>
                <li>Započni planinarenje - aplikacija prati put</li>
                <li>Završi rutu kada stigneš na cilj</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">4</div>
          <div className="step-content">
            <h2>Praćenje rute u realnom vremenu</h2>
            <p>Koristi GPS praćenje da beležiš svoju putanju dok šetaš.</p>
            <div className="step-details">
              <h3>Praćenje na terenu:</h3>
              <ul>
                <li>Otvori rutu koju želiš da pratiš</li>
                <li>Klikni "Započni praćenje"</li>
                <li>Aplikacija automatski beleži tvoju poziciju</li>
                <li>Vidi gde se nalaziš na mapi u realnom vremenu</li>
                <li>Baterija - optimizuj za duže praćenje</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">5</div>
          <div className="step-content">
            <h2>Uredi svoj profil</h2>
            <p>Personalizuj svoj nalog i pokaži drugim planinarima svoje iskustvo.</p>
            <div className="step-details">
              <h3>Opcije profila:</h3>
              <ul>
                <li>Dodaj profilnu sliku i avatar</li>
                <li>Unesi svoj grad i državu</li>
                <li>Pogledaj statistiku svojih ruta</li>
                <li>Uredi lične podatke</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">6</div>
          <div className="step-content">
            <h2>Prirodnjački kviz</h2>
            <p>Testiraj svoje znanje o prirodi i osvoji poene.</p>
            <div className="step-details">
              <h3>Kako igrati:</h3>
              <ul>
                <li>Klikni na "Prirodnjački kviz" u meniju</li>
                <li>Kreiraj sobu ili pridruži se postojećoj</li>
                <li>Odgovaraj na pitanja o prirodi</li>
                <li>Sakupljaj poene i takmiči se sa drugima</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <div className="step-number">7</div>
          <div className="step-content">
            <h2>Deli svoje rute</h2>
            <p>Pomogni drugim planinarima da otkriju lepe putanje.</p>
            <div className="step-details">
              <h3>Saveti za dobre rute:</h3>
              <ul>
                <li>Dodaj detaljan opis i težinu</li>
                <li>Postavi lepe slike</li>
                <li>Navedi potrebnu opremu</li>
                <li>Ostavi komentare na tuđim rutama</li>
                <li>Oceni rute koje si posetio</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
