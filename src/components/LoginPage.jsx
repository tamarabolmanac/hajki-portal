import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BackgroundImage } from "./BackgroundImage";
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import '../styles/Auth.css';
import GoogleLoginButton from "./GoogleLoginButton";
import { useT } from '../i18n/I18nProvider';
import { FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const Mountain = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
);

const LoginPage = () => {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => { window.location.assign('/'); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    if (!email || !password) {
      setErrorMessage(t('auth.fillAll'));
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth: { email, password } })
      });
      if (!response.ok) {
        let data;
        try { data = await response.json(); } catch { throw new Error(t('auth.loginErr')); }
        let msg = t('auth.loginErr');
        if (response.status === 401) {
          msg = data.message?.toLowerCase().includes('confirm')
            ? t('auth.notConfirmed')
            : t('auth.badCreds');
        } else if (response.status === 404) { msg = t('auth.noUser'); }
        else if (response.status === 422) { msg = t('auth.badEmail'); }
        else if (response.status === 403) { msg = t('auth.notConfirmedShort'); }
        else { msg = data.message || msg; }
        throw new Error(msg);
      }
      const data = await response.json();
      if (!data.token) throw new Error(t('auth.unexpected'));
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userID', data.user_id);
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(explainUnreachableApiError(error, config.apiUrl) || error.message || t('auth.loginErr'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth auth--login">
      <div className="auth__bg">
        <BackgroundImage src="/img/hike-login.jpg" alt="Planinarenje" className="" fetchPriority="high" />
        <div className="auth__bg-ov" />
      </div>

      <div className="auth__wrap">
        <div className="auth__logo"><Mountain /><span>Hajki</span></div>

        <div className="auth__card">
          <h1 className="auth__h1">{t('auth.loginH1')}</h1>
          <p className="auth__sub">{t('auth.loginSub')}</p>

          {errorMessage && <div className="auth__err">{errorMessage}</div>}

          <form onSubmit={handleLogin}>
            <div className="auth__field">
              <FaEnvelope size={15} />
              <input className="auth__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPh')} required />
            </div>
            <div className="auth__field">
              <FaLock size={15} />
              <input className="auth__input" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPh')} required />
              <button type="button" className="auth__eye" onClick={() => setShowPass((v) => !v)} aria-label={t('auth.showPass')}>
                {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            <p className="auth__forgot"><Link to="/forgot-password">{t('auth.forgot')}</Link></p>

            <button type="submit" className="auth__btn" disabled={isLoading}>
              {isLoading ? t('auth.signingIn') : <>{t('auth.signIn')} <FaArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth__divider"><span>{t('auth.orSignIn')}</span></div>
          <div className="auth__google"><GoogleLoginButton onLoggedIn={handleGoogleLogin} /></div>
        </div>

        <p className="auth__foot">{t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
