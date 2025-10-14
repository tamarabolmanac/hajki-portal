import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ChoseRouteCreationType.css';

export const ChoseRouteCreationType = () => {
  const navigate = useNavigate();

  const handleTrackRoute = () => {
    // Navigate to route tracker for creating new route
    navigate('/track-new-route');
  };

  const handleCreateManually = () => {
    // Navigate to manual route creation form
    navigate('/create-route-manual');
  };

  return (
    <div className="chose-route-creation-container">
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