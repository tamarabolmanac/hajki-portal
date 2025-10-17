import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Profile } from './Profile';
import '../styles/Navigation.css';

export const Navigation = (props) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(location.pathname); // State for active link
  
  
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Update active link on route change
    setActiveLink(location.pathname);
  }, [location.pathname]);


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
  }, []); // Removed dependency to avoid re-renders on every storage change

  const toggleMenu = () => {
    setIsMenuOpen(prevIsMenuOpen => !prevIsMenuOpen); // Toggle based on previous state
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLinkClick = (path) => {
    if (path !== '/#about') {
      setActiveLink(path);
    }
    closeMenu();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    handleLinkClick('/');
    navigate('/');
  };

  const handleHomeClick = () => {
    setActiveLink('/');
    closeMenu();
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setActiveLink('/#about'); // Set a unique identifier for 'O nama'
    closeMenu();
  };


  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <Link className="navbar-brand" to="/" onClick={handleHomeClick}>
            <img className="logo-navbar" src="/img/logo_small.png" alt="Hajki Logo" />
          </Link>
          <button
            type="button"
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            ref={buttonRef}
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
              <Link to="/routes" className={`page-scroll ${activeLink === '/routes' ? 'active' : ''}`} onClick={() => handleLinkClick('/routes')}>
                Pretraži rute
              </Link>
            </li>
            {isLoggedIn && (
              <>
                <li>
                  <Link to="/my_routes" className={`page-scroll ${activeLink === '/my_routes' ? 'active' : ''}`} onClick={() => handleLinkClick('/my_routes')}>
                    Moje rute
                  </Link>
                </li>
                <li>
                  <Link to="/nearby" className={`page-scroll ${activeLink === '/nearby' ? 'active' : ''}`} onClick={() => handleLinkClick('/nearby')}>
                    Blizu mene
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to="/contact" className={`page-scroll ${activeLink === '/contact' ? 'active' : ''}`} onClick={() => handleLinkClick('/contact')}>
                Kontakt
              </Link>
            </li>
            <li>
              <a href="#about" className={`page-scroll ${activeLink === '/#about' ? 'active' : ''}`} onClick={handleAboutClick}>
                O nama
              </a>
            </li>
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/profile" className={`page-scroll ${activeLink === '/profile' ? 'active' : ''}`} onClick={() => handleLinkClick('/profile')}>
                    Moj profil
                  </Link>
                </li>
                <li>
                  <a href="#" className="page-scroll" onClick={handleLogout} style={{ color: '#ff4444' }}>
                    Odjavi se
                  </a>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={`page-scroll ${activeLink === '/login' ? 'active' : ''}`} onClick={() => handleLinkClick('/login')}>
                    Prijava
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={`page-scroll ${activeLink === '/register' ? 'active' : ''}`} onClick={() => handleLinkClick('/register')}>
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
