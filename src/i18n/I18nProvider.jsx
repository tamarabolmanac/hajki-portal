import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from './translations';

const STORAGE_KEY = 'hajkiLang';
export const SUPPORTED_LANGS = ['sr', 'en'];

const detectInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch { /* ignore */ }
  try {
    const nav = (navigator.language || 'sr').slice(0, 2).toLowerCase();
    if (SUPPORTED_LANGS.includes(nav)) return nav;
  } catch { /* ignore */ }
  return 'sr';
};

const I18nContext = createContext({ lang: 'sr', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  const setLang = useCallback((l) => {
    if (!SUPPORTED_LANGS.includes(l)) return;
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
    try { document.documentElement.lang = l; } catch { /* ignore */ }
  }, []);

  // t('key', { var: 'x' }) → string; falls back to sr, then to the key.
  const t = useCallback((key, vars) => {
    const dict = translations[lang] || translations.sr;
    let str = dict[key] != null ? dict[key] : (translations.sr[key] != null ? translations.sr[key] : key);
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}

export default I18nProvider;
