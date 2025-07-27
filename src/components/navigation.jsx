import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Profile } from './Profile';

export const Navigation = (props) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!token);
    
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [localStorage.getItem('authToken')]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate("/");
    setTimeout(() => {
      const element = document.getElementById("about");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <img  className="logo-navbar" src="../../img/logo_small.png" ></img>
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            {" "}
            <span className="sr-only">Toggle navigation</span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
            <span className="icon-bar"></span>{" "}
          </button>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <Link to="/routes">
                Pretraži rute
              </Link>
            </li>
            {/**
            <li>
              <a href="#services" className="page-scroll">
                Gde za vikend?
              </a>
            </li>
            */}
            <li>
              <a href="#portfolio" className="page-scroll">
                Mapa
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll">
                Kontakt
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll" onClick={handleAboutClick}>
                O nama
              </a>
            </li>
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/profile" className="page-scroll">
                    Moj profil
                  </Link>
                </li>
                <li>
                  <a href="#" className="page-scroll" onClick={handleLogout} style={{ color: '#ff4444' }}>
                    Odjavi se
                  </a>
                </li>
                <li>
                  <Link to="/profile" className="page-scroll">
                    <span className="username-badge">{user?.username}</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="page-scroll">
                    Prijava
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="page-scroll">
                    Registracija
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};
