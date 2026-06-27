import React from 'react';
import { useT } from '../i18n/I18nProvider';
import '../styles/AppLoader.css';

const Mountain = () => (
  <svg className="hjk-loader__mtn" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

export const AppLoader = ({ title, subtitle = '', compact = false }) => {
  const { t } = useT();
  const titleText = title || t('loader.default');
  return (
    <div className={`hjk-loader ${compact ? 'hjk-loader--compact' : ''}`}>
      <div className="hjk-loader__card">
        <div className="hjk-loader__ringwrap" aria-hidden="true">
          <svg className="hjk-loader__ring" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(80,200,120,0.15)" strokeWidth="4" />
            <circle cx="40" cy="40" r="36" fill="none" stroke="#50C878" strokeWidth="4" strokeDasharray="60 165" strokeLinecap="round" />
          </svg>
          <Mountain />
        </div>
        <div className="hjk-loader__text">
          <p className="hjk-loader__title">{titleText}</p>
          {subtitle ? <p className="hjk-loader__sub">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default AppLoader;
