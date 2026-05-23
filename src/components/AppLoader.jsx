import React from 'react';

export const AppLoader = ({ title = 'Učitavanje...', subtitle = '', compact = false }) => {
  return (
    <div className={`app-loader-shell ${compact ? 'app-loader-shell-compact' : ''}`}>
      <div className="app-loader-card">
        <div className="app-loader-logo-wrap" aria-hidden="true">
          <div className="app-loader-ring" />
          <img src="/img/small-logo.png" alt="" className="app-loader-logo" />
        </div>
        <h2 className="app-loader-title">{title}</h2>
        {subtitle ? <p className="app-loader-subtitle">{subtitle}</p> : null}
      </div>
    </div>
  );
};

export default AppLoader;
