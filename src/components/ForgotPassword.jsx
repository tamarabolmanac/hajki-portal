import React, { useState } from 'react';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaArrowRight } from 'react-icons/fa';
import '../styles/Auth.css';
import HajkiMark from './HajkiMark';
import { useT } from '../i18n/I18nProvider';

export const ForgotPassword = () => {
  const { t, lang } = useT();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: lang })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('fp.error'));
      }

      setMessage(t('fp.sent'));
      setIsSuccess(true);
      setTimeout(() => { navigate('/forgot-password'); }, 2000);
    } catch (error) {
      setIsSuccess(false);
      setMessage(explainUnreachableApiError(error, config.apiUrl) || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth auth--login">
      <div className="auth__bg">
        <div className="auth__bg-ov" />
      </div>

      <div className="auth__wrap">
        <div className="auth__logo"><HajkiMark size={28} /><span>Hajki</span></div>

        <div className="auth__card">
          <h1 className="auth__h1">{t('fp.title')}</h1>
          <p className="auth__sub">{t('fp.sub')}</p>

          {message && (
            <div className={isSuccess ? 'auth__ok' : 'auth__err'}>{message}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth__field">
              <FaEnvelope size={15} />
              <input
                className="auth__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('fp.emailPh')}
              />
            </div>

            <button type="submit" className="auth__btn" disabled={isLoading}>
              {isLoading ? t('fp.sending') : <>{t('fp.send')} <FaArrowRight size={16} /></>}
            </button>
          </form>

          <p className="auth__foot"><Link to="/login">{t('fp.back')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
