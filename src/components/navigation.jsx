import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Profile } from './Profile';
import '../styles/Navigation.css';
import { authenticatedFetch } from '../utils/api';

export const Navigation = (props) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(location.pathname); // State for active link
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const [isRoutesOpen, setIsRoutesOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNalogOpen, setIsNalogOpen] = useState(false);
  const [showPrirodaSrbije, setShowPrirodaSrbije] = useState(false);
  
  
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
    // Feature flag: da li se "Priroda Srbije" prikazuje u meniju (kontroliše admin)
    authenticatedFetch('/settings')
      .then((data) => setShowPrirodaSrbije(!!data?.show_priroda_srbije))
      .catch(() => setShowPrirodaSrbije(false));
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
    setIsMenuOpen(prevIsMenuOpen => !prevIsMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsRoutesOpen(false);
    setIsInfoOpen(false);
    setIsNalogOpen(false);
  };

  const handleLinkClick = (path, e) => {
    const isTrackingScreen = location.pathname.startsWith('/track-new-route/');
    const activeRouteId = localStorage.getItem('tracking:active_route_id');
    const startedKey = activeRouteId ? `tracking:route:${activeRouteId}:started` : null;
    const started = startedKey ? localStorage.getItem(startedKey) === '1' : false;

    if (isTrackingScreen && activeRouteId && started && path !== location.pathname) {
      if (e?.preventDefault) e.preventDefault();
      setPendingPath(path);
      setConfirmLeave(true);
      closeMenu();
      return;
    }
    setActiveLink(path);
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

  const handleAboutClick = () => {
    setActiveLink('/about');
    closeMenu();
  };


  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="navbar-inner">
        <Link className="navbar-brand" to="/" onClick={handleHomeClick}>
          <img className="logo-navbar" src="/img/small-logo.png" alt="Hajki Logo" />
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

        <div
          className={`collapse navbar-collapse ${isMenuOpen ? 'in' : ''}`}
          id="bs-example-navbar-collapse-1"
          ref={menuRef}
        >
          <ul className="nav navbar-nav navbar-right">

            {/* Istraži dropdown */}
            <li className={`nav-dropdown ${isRoutesOpen ? 'open' : ''}`}>
              <button
                className={`page-scroll nav-dropdown-toggle ${['/routes', '/priroda', '/preporuka', '/prirodnjacki-kviz'].includes(activeLink) ? 'active' : ''}`}
                onClick={() => { setIsRoutesOpen(prev => !prev); setIsInfoOpen(false); setIsNalogOpen(false); }}
              >
                Istraži <span className="nav-dropdown-arrow">{isRoutesOpen ? '▲' : '▼'}</span>
              </button>
              <ul className="nav-dropdown-menu">
                <li>
                  <Link to="/routes" className={`page-scroll ${activeLink === '/routes' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/routes', e)}>
                    Pretraži rute
                  </Link>
                </li>
                {showPrirodaSrbije && (
                  <li>
                    <Link to="/priroda" className={`page-scroll ${activeLink === '/priroda' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/priroda', e)}>
                      Priroda Srbije
                    </Link>
                  </li>
                )}
                {isLoggedIn && (
                  <li>
                    <Link to="/prirodnjacki-kviz" className={`page-scroll ${activeLink === '/prirodnjacki-kviz' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/prirodnjacki-kviz', e)}>
                      Kviz sa prijateljem
                    </Link>
                  </li>
                )}
                {/* "Preporuka za šetnju" privremeno sakriveno iz menija (komponenta i ruta ostaju) */}
              </ul>
            </li>

            {/* Info dropdown */}
            <li className={`nav-dropdown ${isInfoOpen ? 'open' : ''}`}>
              <button
                className={`page-scroll nav-dropdown-toggle ${['/contact', '/about'].includes(activeLink) ? 'active' : ''}`}
                onClick={() => { setIsInfoOpen(prev => !prev); setIsRoutesOpen(false); setIsNalogOpen(false); }}
              >
                Info <span className="nav-dropdown-arrow">{isInfoOpen ? '▲' : '▼'}</span>
              </button>
              <ul className="nav-dropdown-menu">
                <li>
                  <Link to="/about" className={`page-scroll ${activeLink === '/about' ? 'active' : ''}`} onClick={handleAboutClick}>
                    O nama
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className={`page-scroll ${activeLink === '/contact' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/contact', e)}>
                    Kontakt
                  </Link>
                </li>
              </ul>
            </li>

            {/* Nalog dropdown */}
            {isLoggedIn ? (
              <li className={`nav-dropdown ${isNalogOpen ? 'open' : ''}`}>
                <button
                  className={`page-scroll nav-dropdown-toggle ${['/profile'].includes(activeLink) ? 'active' : ''}`}
                  onClick={() => { setIsNalogOpen(prev => !prev); setIsRoutesOpen(false); setIsInfoOpen(false); }}
                >
                  <span className="nav-user-name">{user?.name?.split(' ')[0] || 'Nalog'}</span>
                  <span className="nav-dropdown-arrow">{isNalogOpen ? '▲' : '▼'}</span>
                </button>
                <ul className="nav-dropdown-menu nav-dropdown-menu--nalog">
                  <li>
                    <Link to="/profile" className={`page-scroll ${activeLink === '/profile' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/profile', e)}>
                      Moj profil
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="page-scroll nav-logout" onClick={handleLogout}>
                      Odjavi se
                    </a>
                  </li>
                </ul>
              </li>
            ) : (
              <li className={`nav-dropdown ${isNalogOpen ? 'open' : ''}`}>
                <button
                  className={`page-scroll nav-dropdown-toggle ${['/login', '/register'].includes(activeLink) ? 'active' : ''}`}
                  onClick={() => { setIsNalogOpen(prev => !prev); setIsRoutesOpen(false); setIsInfoOpen(false); }}
                >
                  Nalog <span className="nav-dropdown-arrow">{isNalogOpen ? '▲' : '▼'}</span>
                </button>
                <ul className="nav-dropdown-menu">
                  <li>
                    <Link to="/login" className={`page-scroll ${activeLink === '/login' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/login', e)}>
                      Prijava
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className={`page-scroll ${activeLink === '/register' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/register', e)}>
                      Registracija
                    </Link>
                  </li>
                </ul>
              </li>
            )}
            
          </ul>
        </div>
      </div>

      {confirmLeave && (
        <div
          className="nav-confirm-modal-backdrop"
          onClick={() => setConfirmLeave(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '18px 16px',
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>Prekid snimanja rute</h3>
            <p style={{ margin: '0 0 14px 0', color: '#4a5568' }}>
              Da li zaista želite da prekinete snimanje rute?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  // DA: prekini i SAČUVAJ (finalize), pa idi dalje
                  const rid = localStorage.getItem('tracking:active_route_id');
                  try {
                    if (rid) {
                      await authenticatedFetch(`/routes/${rid}/finalize`, { method: 'POST' });
                    }
                  } catch (e) {
                    console.error('Greška pri finalizaciji rute:', e);
                  } finally {
                    if (rid) localStorage.removeItem(`tracking:route:${rid}:started`);
                    localStorage.removeItem('tracking:active_route_id');
                    setConfirmLeave(false);
                    if (pendingPath) navigate(pendingPath);
                  }
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(15, 23, 42, 0.15)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Da, prekini
              </button>
              <button
                type="button"
                onClick={() => {
                  // Nastavi snimanje: ostani na ekranu i zatvori modal
                  setConfirmLeave(false);
                  setPendingPath(null);
                }}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                Nastavi snimanje
              </button>
            </div>
          </div>
        </div>
      )}
      
    </nav>
  );
};
