import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import '../styles/LoginPage.css';
import HajkiMark from './HajkiMark';
import { useT } from '../i18n/I18nProvider';

export const ResetPassword = () => {
  const { t } = useT();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setMessage(t('rp.invalid'));
      setIsTokenValid(false);
    } else {
      setToken(tokenFromUrl);
      setIsTokenValid(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (password !== confirmPassword) {
      setMessage(t('rp.mismatch'));
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage(t('rp.tooShort'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, password_confirmation: confirmPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('rp.error'));
      }

      setMessage(t('rp.success'));
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setMessage(explainUnreachableApiError(error, config.apiUrl) || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-form">
            <div className="login-logo">
              <div className="logo-text">
                <span className="logo-icon">
                <HajkiMark size={34} style={{ color: "#50C878" }} />
              </span>
                <span>Hajki</span>
              </div>
              <h1>{t('rp.checking')}</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-form">
            <div className="login-logo">
              <div className="logo-text">
                <span className="logo-icon">
                <HajkiMark size={34} style={{ color: "#50C878" }} />
              </span>
                <span>Hajki</span>
              </div>
              <h1>{t('rd.error')}</h1>
              <p>{message}</p>
            </div>
            <div className="back-to-login">
              <a href="/login">{t('fp.back')}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-logo">
            <div className="logo-text">
              <span className="logo-icon">
                <HajkiMark size={34} style={{ color: "#50C878" }} />
              </span>
              <span>Hajki</span>
            </div>
            <h1>{t('rp.title')}</h1>
            <p>{t('rp.sub')}</p>
          </div>

          {message && (
            <div className={`message ${message === t('rp.success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('rp.passwordPh')}
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon">
                <span className="icon">🔒</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder={t('rp.confirmPh')}
                  minLength="6"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? t('rp.saving') : t('rp.save')}
              <span className="button-icon">→</span>
            </button>
          </form>

          <div className="back-to-login">
            <a href="/login">{t('fp.back')}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
