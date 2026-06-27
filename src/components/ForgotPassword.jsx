import React, { useState } from 'react';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/LoginPage.css';
import { useT } from '../i18n/I18nProvider';

export const ForgotPassword = () => {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${config.apiUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('fp.error'));
      }

      setMessage(t('fp.sent'));
      setIsSuccess(true);

      // Stay on the same page as requested
      setTimeout(() => {
        navigate('/forgot-password');
      }, 2000);
      
    } catch (error) {
      setMessage(explainUnreachableApiError(error, config.apiUrl) || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-logo">
            <div className="logo-text">
              <span className="logo-icon">
                <img src="/img/beaver_image.png" alt="Hajki Beaver" style={{width: "40px", height: "60px", borderRadius: "50%"}} />
              </span>
              <span>Hajki</span>
            </div>
            <h1>{t('fp.title')}</h1>
            <p>{t('fp.sub')}</p>
          </div>

          {message && (
            <div className={`message ${isSuccess ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon">
                <span className="icon">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('fp.emailPh')}
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? t('fp.sending') : t('fp.send')}
              <span className="button-icon">→</span>
            </button>
          </form>

          <div className="back-to-login">
            <Link to="/login">{t('fp.back')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
