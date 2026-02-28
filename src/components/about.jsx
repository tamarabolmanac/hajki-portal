import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/about.css";

export const About = (props) => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    navigate('/routes');
  };

  const handleLearnMoreClick = () => {
    navigate('/guide');
  };

  return (
    <div id="about">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-text">
              <h1>Vreme je za bolje planinarenje</h1>
              <h2>Otkrij prirodu, prati svoje rute, deli avanture</h2>
              <p>
                Hajki je tvoj savršen pratilac za planinske avanture. 
                Prati svoje putanje, otkrivaj nove rute i poveži se sa zajednicom planinara.
              </p>
              <div className="hero-buttons">
                <button className="btn-primary" onClick={handleExploreClick}>Počni da istražuješ</button>
                <button className="btn-secondary" onClick={handleLearnMoreClick}>Saznaj više</button>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-visual">
              <div className="mountain-graphic">
                <div className="mountain-layer layer-1"></div>
                <div className="mountain-layer layer-2"></div>
                <div className="mountain-layer layer-3"></div>
                <div className="sun"></div>
                <div className="cloud cloud-1"></div>
                <div className="cloud cloud-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
