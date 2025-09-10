import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Profile } from './Profile';
import '../styles/Navigation.css';

export const Navigation = (props) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    closeMenu();
    navigate('/');
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    closeMenu();
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
          <Link to="/" className="navbar-brand page-scroll" onClick={closeMenu}>
            <img className="logo-navbar" src="/img/logo_small.png" alt="Hajki Logo" />
          </Link>
          <button
            type="button"
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="bs-example-navbar-collapse-1"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
        </div>

        <div
          className={`collapse navbar-collapse ${isMenuOpen ? 'in' : ''}`}
          id="bs-example-navbar-collapse-1"
          ref={menuRef}
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <Link to="/routes" className="page-scroll" onClick={closeMenu}>
                Pretraži rute
              </Link>
            </li>
            <li>
              <a href="#portfolio" className="page-scroll" onClick={closeMenu}>
                Mapa
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll" onClick={closeMenu}>
                Kontakt
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll" onClick={(e) => { handleAboutClick(e); closeMenu(); }}>
                O nama
              </a>
            </li>
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/profile" className="page-scroll" onClick={closeMenu}>
                    Moj profil
                  </Link>
                </li>
                <li>
                  <a href="#" className="page-scroll" onClick={handleLogout} style={{ color: '#ff4444' }}>
                    Odjavi se
                  </a>
                </li>
                <li>
                  <Link to="/profile" className="page-scroll" onClick={closeMenu}>
                    <span className="username-badge">{user?.username}</span>
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="page-scroll" onClick={closeMenu}>
                    Prijava
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="page-scroll" onClick={closeMenu}>
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
