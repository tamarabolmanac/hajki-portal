import React from "react";
import { BackgroundImage } from "./BackgroundImage";
import "../styles/contact.css";

export const Contact = (props) => {
  return (
    <div id="contact" className="contact-hero">
      <div className="contact-background">
        <BackgroundImage
          src="/img/contact.jpg"
          alt="Kontakt - Hajki"
          className="contact-hero-image"
          fetchPriority="low"
        />
        <div className="contact-overlay" />
      </div>

      <div className="contact-container">
        <div className="contact-card">
          <span className="contact-badge">Kontakt</span>
          <h1 className="contact-title">Povežite se sa nama</h1>
          <p className="contact-lead">
            Želite da podelite svoje iskustvo ili predlog? Kontaktirajte nas -
            tu smo da vam pomognemo u vašoj sledećoj avanturi.
          </p>
          <p className="contact-text">
            Naš tim je uvek spreman da odgovori na vaša pitanja o pešačkim rutama,
            biciklističkim stazama ili bilo čemu što se tiče aktivnog provođenja
            vremena u prirodi.
          </p>
          <ul className="contact-list">
            <li>
              <span className="contact-list-icon" aria-hidden="true">
                📧
              </span>
              <span>
                Pošaljite nam email na:{" "}
                <strong>info@hajki.rs</strong>
              </span>
            </li>
            <li>
              <span className="contact-list-icon" aria-hidden="true">
                📱
              </span>
              <span>
                Pozovite nas:{" "}
                <strong>+381 62 871 43 65</strong>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
