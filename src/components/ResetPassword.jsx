import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import { FaLock, FaArrowRight } from 'react-icons/fa';
import '../styles/Auth.css';
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
  const [isSuccess, setIsSuccess] = useState(false);
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
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage(t('rp.tooShort'));
      setIsSuccess(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, password_confirmation: confirmPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('rp.error'));
      }

      setMessage(t('rp.success'));
      setIsSuccess(true);
      setTimeout(() => { navigate('/login'); }, 2000);
    } catch (error) {
      setIsSuccess(false);
      setMessage(explainUnreachableApiError(error, config.apiUrl) || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const Shell = ({ children }) => (
    <div className="auth auth--login">
      <div className="auth__bg"><div className="auth__bg-ov" /></div>
      <div className="auth__wrap">
        <div className="auth__logo"><HajkiMark size={28} /><span>Hajki</span></div>
        <div className="auth__card">{children}</div>
      </div>
    </div>
  );

  if (isTokenValid === null) {
    return <Shell><h1 className="auth__h1">{t('rp.checking')}</h1></Shell>;
  }

  if (isTokenValid === false) {
    return (
      <Shell>
        <h1 className="auth__h1">{t('rd.error')}</h1>
        <p className="auth__sub">{message}</p>
        <p className="auth__foot"><Link to="/login">{t('fp.back')}</Link></p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="auth__h1">{t('rp.title')}</h1>
      <p className="auth__sub">{t('rp.sub')}</p>

      {message && (
        <div className={isSuccess ? 'auth__ok' : 'auth__err'}>{message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="auth__field">
          <FaLock size={15} />
          <input
            className="auth__input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('rp.passwordPh')}
            minLength="6"
          />
        </div>

        <div className="auth__field">
          <FaLock size={15} />
          <input
            className="auth__input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('rp.confirmPh')}
            minLength="6"
          />
        </div>

        <button type="submit" className="auth__btn" disabled={isLoading}>
          {isLoading ? t('rp.saving') : <>{t('rp.save')} <FaArrowRight size={16} /></>}
        </button>
      </form>

      <p className="auth__foot"><Link to="/login">{t('fp.back')}</Link></p>
    </Shell>
  );
};

export default ResetPassword;
