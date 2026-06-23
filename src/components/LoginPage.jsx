import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BackgroundImage } from "./BackgroundImage";
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import '../styles/Auth.css';
import GoogleLoginButton from "./GoogleLoginButton";
import { FaEnvelope, FaLock, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';

const Mountain = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
);

const LoginPage = () => {
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
      setErrorMessage("Molimo vas da unesete sve podatke.");
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
        try { data = await response.json(); } catch { throw new Error('Greška pri prijavljivanju. Pokušajte ponovo.'); }
        let msg = 'Greška pri prijavljivanju. Pokušajte ponovo.';
        if (response.status === 401) {
          msg = data.message?.toLowerCase().includes('confirm')
            ? 'Vaš nalog nije potvrđen. Proverite email i kliknite na link za potvrdu.'
            : 'Pogrešna email adresa ili lozinka.';
        } else if (response.status === 404) { msg = 'Korisnik sa ovim email-om ne postoji.'; }
        else if (response.status === 422) { msg = 'Neispravan format email-a.'; }
        else if (response.status === 403) { msg = 'Vaš nalog nije potvrđen. Proverite email.'; }
        else { msg = data.message || msg; }
        throw new Error(msg);
      }
      const data = await response.json();
      if (!data.token) throw new Error('Došlo je do neočekivane greške. Pokušajte ponovo.');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userID', data.user_id);
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(explainUnreachableApiError(error, config.apiUrl) || error.message || 'Greška pri prijavljivanju.');
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
          <h1 className="auth__h1">Dobrodošli nazad</h1>
          <p className="auth__sub">Prijavite se za nastavak</p>

          {errorMessage && <div className="auth__err">{errorMessage}</div>}

          <form onSubmit={handleLogin}>
            <div className="auth__field">
              <FaEnvelope size={15} />
              <input className="auth__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email adresa" required />
            </div>
            <div className="auth__field">
              <FaLock size={15} />
              <input className="auth__input" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lozinka" required />
              <button type="button" className="auth__eye" onClick={() => setShowPass((v) => !v)} aria-label="Prikaži lozinku">
                {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
              </button>
            </div>
            <p className="auth__forgot"><Link to="/forgot-password">Zaboravili ste lozinku?</Link></p>

            <button type="submit" className="auth__btn" disabled={isLoading}>
              {isLoading ? 'Prijavljivanje...' : <>Prijavi se <FaArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth__divider"><span>ili se prijavite sa</span></div>
          <div className="auth__google"><GoogleLoginButton onLoggedIn={handleGoogleLogin} /></div>
        </div>

        <p className="auth__foot">Nemate nalog? <Link to="/register">Registrujte se</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
