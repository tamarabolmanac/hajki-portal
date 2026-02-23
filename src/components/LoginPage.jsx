import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { config } from '../config';
import '../styles/LoginPage.css';
import GoogleLoginButton from "./GoogleLoginButton";
import { FaEnvelope, FaLock, FaArrowRight, FaHiking } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleGoogleLogin = (userData) => {
    // setUser(userData);
    navigate('/dashboard');
  };

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
        try {
          data = await response.json();
        } catch (e) {
          throw new Error('Greška pri prijavljivanju. Pokušajte ponovo.');
        }
        
        let errorMessage = 'Greška pri prijavljivanju. Pokušajte ponovo.';
        
        if (response.status === 401) {
          errorMessage = data.message?.toLowerCase().includes('confirm') 
            ? 'Vaš nalog nije potvrđen. Proverite email i kliknite na link za potvrdu.'
            : 'Pogrešna email adresa ili lozinka.';
        } else if (response.status === 404) {
          errorMessage = 'Korisnik sa ovim email-om ne postoji.';
        } else if (response.status === 422) {
          errorMessage = 'Neispravan format email-a.';
        } else if (response.status === 403) {
          errorMessage = 'Vaš nalog nije potvrđen. Proverite email.';
        } else {
          errorMessage = data.message || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Došlo je do neočekivane greške. Pokušajte ponovo.');
      }
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userID', data.user_id);
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <h1>Dobrodošli nazad</h1>
          <p>Prijavite se za nastavak</p>
        </div>

        {errorMessage && (
          <div className="error-message">
            <span>!</span> {errorMessage}
          </div>
        )}
      
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope className="icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email adresa"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <div className="input-icon">
              <FaLock className="icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Lozinka"
                required
              />
            </div>
            <div className="forgot-password">
              <Link to="/forgot-password">Zaboravili ste lozinku?</Link>
            </div>
            
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Prijavljivanje...' : 'Prijavi se'}
            {!isLoading && <FaArrowRight className="button-icon" />}
          </button>
        </form>

        <div className="divider">
          <span>ili se prijavite sa</span>
        </div>
        
        <div className="google-login-container">
          <GoogleLoginButton onLoggedIn={handleGoogleLogin} />
        </div>

        <div className="register-link">
          Nemate nalog? <Link to="/register">Registrujte se</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
