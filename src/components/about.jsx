import React from "react";
import { useNavigate } from "react-router-dom";
import { BackgroundImage } from "./BackgroundImage";
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
    <div id="about" className="hero-landing about-modern">
      <div className="hero-background">
        <BackgroundImage
          src="/img/about-us.jpg"
          alt="O nama - planinarenje"
          className="hero-image"
        />
        <div className="hero-overlay" />
      </div>
      <div className="hero-container">
        <div className="hero-content">
          <span className="hero-badge">O nama</span>
          <div className="hero-text">
            <h1>Vreme je za HAJKi</h1>
            <h2>Podeli svoje avanture, pronadji mesta prema svojim željama, poveži se sa zajednicom</h2>

            <div className="hero-buttons">
              <button className="btn-primary" onClick={handleExploreClick}>Počni da istražuješ</button>
              <button className="btn-secondary" onClick={handleLearnMoreClick}>Saznaj više</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
