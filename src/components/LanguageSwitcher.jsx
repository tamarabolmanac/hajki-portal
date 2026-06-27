import React from 'react';
import { useT, SUPPORTED_LANGS } from '../i18n/I18nProvider';
import '../styles/LanguageSwitcher.css';

/** SR / EN segmented toggle. */
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useT();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label="Language">
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-switch__btn ${lang === l ? 'is-on' : ''}`}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
