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
  
  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallOption, setShowInstallOption] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
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

  // PWA Install useEffect
  useEffect(() => {
    console.log('Navigation PWA Debug:', {
      userAgent: navigator.userAgent,
      standalone: window.navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      console.log('App is already installed');
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone;
    
    console.log('iOS Detection:', { isIOSDevice, isInStandaloneMode });
    
    if (isIOSDevice && !isInStandaloneMode) {
      console.log('iOS device detected, showing install option');
      setShowInstallOption(true);
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallOption(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('App installed event fired');
      setIsInstalled(true);
      setShowInstallOption(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
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

  const handleAboutClick = (e) => {
    e.preventDefault();
    setActiveLink('/#about'); // Set a unique identifier for 'O nama'
    closeMenu();
  };

  const handleInstallApp = async () => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOSDevice) {
      // Show iOS instructions
      setShowIOSInstructions(true);
      closeMenu();
      return;
    }

    if (!deferredPrompt) {
      // Fallback for browsers that don't support beforeinstallprompt
      alert('To install this app:\n\n1. Open browser menu\n2. Look for "Install" or "Add to Home Screen"\n3. Follow the prompts');
      closeMenu();
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowInstallOption(false);
    } catch (error) {
      console.error('Error during install:', error);
    }
    
    closeMenu();
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <Link to="/" className="navbar-brand page-scroll" onClick={() => handleLinkClick('/')}>
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
              <li>
                <Link to="/my_routes" className={`page-scroll ${activeLink === '/my_routes' ? 'active' : ''}`} onClick={() => handleLinkClick('/my_routes')}>
                  Moje rute
                </Link>
              </li>
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
            
            {/* Install App - Last option */}
            {/* Debug: Always show for now */}
            <li>
              <a href="#" className="page-scroll install-app-link" onClick={handleInstallApp} style={{ color: '#4CAF50', fontWeight: '600' }}>
                📱 Install App {showInstallOption ? '●' : '○'} {isInstalled ? '✓' : '✗'}
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '350px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#2E7D32', marginBottom: '20px' }}>
              Install Hajki App
            </h3>
            <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
              To install this app on your iPhone:
            </p>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <p style={{ marginBottom: '10px' }}>
                1. Tap the <strong>Share</strong> button <span style={{ fontSize: '18px' }}>⬆️</span>
              </p>
              <p style={{ marginBottom: '10px' }}>
                2. Scroll down and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: '18px' }}>📱</span>
              </p>
              <p>
                3. Tap <strong>"Add"</strong> to confirm
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
