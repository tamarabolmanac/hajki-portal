import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundImage } from './BackgroundImage';
import '../styles/ChoseRouteCreationType.css';

export const ChoseRouteCreationType = () => {
  const navigate = useNavigate();

  const handleTrackRoute = () => {
    navigate('/track-new-route');
  };

  const handleCreateManually = () => {
    navigate('/create-route-manual');
  };

  return (
    <div className="chose-route-creation-container">
      <div className="chose-route-creation-bg">
        <BackgroundImage
          src="/img/create-route.jpg"
          alt=""
          className="chose-route-creation-bg-image"
          fetchPriority="high"
        />
        <div className="chose-route-creation-overlay" />
      </div>
      <div className="chose-route-creation-content">
        <h1 className="chose-route-title">Kreiranje nove rute</h1>
        <p className="chose-route-subtitle">
          Izaberite način kreiranja vaše rute
        </p>
        
        <div className="route-creation-options">
          <div className="option-card">
            <div className="option-icon">
              📍
            </div>
            <h3>Snimi putanju</h3>
            <p>
              Uključite GPS praćenje i idite na planinarenje. 
              Aplikacija će automatski snimiti vašu putanju.
            </p>
            <button 
              className="route-creation-btn track-btn"
              onClick={handleTrackRoute}
            >
              🗺️ Snimi putanju
            </button>
          </div>

          <div className="option-card">
            <div className="option-icon">
              ✏️
            </div>
            <h3>Kreiraj rutu bez snimanja putanje</h3>
            <p>
              Unesite informacije o ruti ručno - naziv, opis, 
              lokaciju i fotografije.
            </p>
            <button 
              className="route-creation-btn manual-btn"
              onClick={handleCreateManually}
            >
              📝 Kreiraj rutu bez snimanja putanje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};