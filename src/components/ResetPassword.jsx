import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { config } from '../config';
import '../styles/LoginPage.css';

export const ResetPassword = () => {
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
      setMessage('Nevalidan token za resetovanje lozinke');
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
      setMessage('Lozinke se ne poklapaju');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage('Lozinka mora imati najmanje 6 karaktera');
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
        throw new Error(data.message || 'Greška pri resetovanju lozinke');
      }

      setMessage('Lozinka je uspešno promenjena! Preusmeravamo vas na stranicu za prijavu...');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setMessage(error.message);
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
                <img src="/img/beaver_image.png" alt="Hajki Beaver" style={{width: "40px", height: "60px", borderRadius: "50%"}} />
              </span>
                <span>Hajki</span>
              </div>
              <h1>Proveravanje tokena...</h1>
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
                <img src="/img/beaver_image.png" alt="Hajki Beaver" style={{width: "40px", height: "60px", borderRadius: "50%"}} />
              </span>
                <span>Hajki</span>
              </div>
              <h1>Greška</h1>
              <p>{message}</p>
            </div>
            <div className="back-to-login">
              <a href="/login">← Nazad na prijavu</a>
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
                <img src="/img/beaver_image.png" alt="Hajki Beaver" style={{width: "40px", height: "60px", borderRadius: "50%"}} />
              </span>
              <span>Hajki</span>
            </div>
            <h1>Reset Lozinke</h1>
            <p>Unesite vašu novu lozinku</p>
          </div>
          
          {message && (
            <div className={`message ${message.includes('uspešno') ? 'success' : 'error'}`}>
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
                  placeholder="Nova lozinka"
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
                  placeholder="Potvrdite novu lozinku"
                  minLength="6"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Čuvanje...' : 'Promeni Lozinku'}
              <span className="button-icon">→</span>
            </button>
          </form>
          
          <div className="back-to-login">
            <a href="/login">← Nazad na prijavu</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
