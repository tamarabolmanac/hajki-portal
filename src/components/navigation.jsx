import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Profile } from './Profile';
import '../styles/Navigation.css';
import { authenticatedFetch } from '../utils/api';
import recordingGuard from '../utils/recordingGuard';
import LanguageSwitcher from './LanguageSwitcher';
import { useT } from '../i18n/I18nProvider';

export const Navigation = (props) => {
  const navigate = useNavigate();
  const { t } = useT();
  const location = useLocation(); // Get current location
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(location.pathname); // State for active link
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

  // Dok traje snimanje rute, recordingGuard presreće navigaciju i RouteTracker
  // prikazuje "prekini snimanje?" dijalog (isti mehanizam kao BottomNav).
  const handleLinkClick = (path, e) => {
    if (path !== location.pathname && recordingGuard.tryLeave()) {
      if (e?.preventDefault) e.preventDefault();
      closeMenu();
      return;
    }
    setActiveLink(path);
    closeMenu();
  };

  const handleLogout = (e) => {
    if (recordingGuard.tryLeave()) {
      if (e?.preventDefault) e.preventDefault();
      closeMenu();
      return;
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setActiveLink('/');
    closeMenu();
    navigate('/');
  };

  const handleHomeClick = (e) => handleLinkClick('/', e);

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="navbar-inner">
        <Link className="navbar-brand nav-brand2" to="/" onClick={handleHomeClick}>
          <svg className="nav-brand2__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
          <span className="nav-brand2__txt">Hajki</span>
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
                {t('nav.explore')} <span className="nav-dropdown-arrow">{isRoutesOpen ? '▲' : '▼'}</span>
              </button>
              <ul className="nav-dropdown-menu">
                <li>
                  <Link to="/routes" className={`page-scroll ${activeLink === '/routes' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/routes', e)}>
                    {t('nav.searchRoutes')}
                  </Link>
                </li>
                {showPrirodaSrbije && (
                  <li>
                    <Link to="/priroda" className={`page-scroll ${activeLink === '/priroda' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/priroda', e)}>
                      {t('nav.nature')}
                    </Link>
                  </li>
                )}
                {isLoggedIn && (
                  <li>
                    <Link to="/prirodnjacki-kviz" className={`page-scroll ${activeLink === '/prirodnjacki-kviz' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/prirodnjacki-kviz', e)}>
                      {t('nav.quizFriend')}
                    </Link>
                  </li>
                )}
                {/* "Preporuka za šetnju" privremeno sakriveno iz menija (komponenta i ruta ostaju) */}
              </ul>
            </li>

            {/* Info dropdown */}
            <li className={`nav-dropdown ${isInfoOpen ? 'open' : ''}`}>
              <button
                className={`page-scroll nav-dropdown-toggle ${['/contact'].includes(activeLink) ? 'active' : ''}`}
                onClick={() => { setIsInfoOpen(prev => !prev); setIsRoutesOpen(false); setIsNalogOpen(false); }}
              >
                {t('nav.info')} <span className="nav-dropdown-arrow">{isInfoOpen ? '▲' : '▼'}</span>
              </button>
              <ul className="nav-dropdown-menu">
                <li>
                  <Link to="/contact" className={`page-scroll ${activeLink === '/contact' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/contact', e)}>
                    {t('nav.contact')}
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
                  <span className="nav-user-name">{user?.name?.split(' ')[0] || t('nav.account')}</span>
                  <span className="nav-dropdown-arrow">{isNalogOpen ? '▲' : '▼'}</span>
                </button>
                <ul className="nav-dropdown-menu nav-dropdown-menu--nalog">
                  <li>
                    <Link to="/profile" className={`page-scroll ${activeLink === '/profile' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/profile', e)}>
                      {t('nav.myProfile')}
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="page-scroll nav-logout" onClick={handleLogout}>
                      {t('nav.logout')}
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
                  {t('nav.account')} <span className="nav-dropdown-arrow">{isNalogOpen ? '▲' : '▼'}</span>
                </button>
                <ul className="nav-dropdown-menu">
                  <li>
                    <Link to="/login" className={`page-scroll ${activeLink === '/login' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/login', e)}>
                      {t('nav.signin')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className={`page-scroll ${activeLink === '/register' ? 'active' : ''}`} onClick={(e) => handleLinkClick('/register', e)}>
                      {t('nav.signup')}
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Green "Nova ruta" CTA (design DesktopNav) */}
            {isLoggedIn && (
              <li className="nav-cta-li">
                <Link to="/new-route" className="nav-cta" onClick={(e) => handleLinkClick('/new-route', e)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  {t('nav.newRoute')}
                </Link>
              </li>
            )}

            <li className="nav-lang-li"><LanguageSwitcher /></li>

          </ul>
        </div>
      </div>

    </nav>
  );
};
