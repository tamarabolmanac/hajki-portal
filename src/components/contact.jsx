import React from "react";
import { BackgroundImage } from "./BackgroundImage";
import { useT } from "../i18n/I18nProvider";
import "../styles/contact.css";

export const Contact = (props) => {
  const { t } = useT();
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
          <span className="contact-badge">{t('contact.badge')}</span>
          <h1 className="contact-title">{t('contact.title')}</h1>
          <p className="contact-lead">{t('contact.lead')}</p>
          <p className="contact-text">{t('contact.text')}</p>
          <ul className="contact-list">
            <li>
              <span className="contact-list-icon" aria-hidden="true">
                📧
              </span>
              <span>
                {t('contact.emailLabel')}{" "}
                <strong>info@hajki.rs</strong>
              </span>
            </li>
            <li>
              <span className="contact-list-icon" aria-hidden="true">
                📱
              </span>
              <span>
                {t('contact.phoneLabel')}{" "}
                <strong>+381 62 871 43 65</strong>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
