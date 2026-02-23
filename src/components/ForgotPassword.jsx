import React, { useState } from 'react';
import { config } from '../config';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/LoginPage.css';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
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
        throw new Error(data.message || 'Greška pri slanju zahteva za resetovanje lozinke');
      }

      setMessage('Link za resetovanje lozinke je poslat na vaš email');
      
      // Stay on the same page as requested
      setTimeout(() => {
        navigate('/forgot-password');
      }, 2000);
      
    } catch (error) {
      setMessage(error.message);
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
            <h1>Reset lozinke</h1>
            <p>Unesite vaš email adresu da biste dobili link za resetovanje lozinke</p>
          </div>
          
          {message && (
            <div className={`message ${message.includes('poslat') ? 'success' : 'error'}`}>
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
                  placeholder="Unesite vaš email"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Slanje...' : 'Pošalji link za resetovanje'}
              <span className="button-icon">→</span>
            </button>
          </form>
          
          <div className="back-to-login">
            <Link to="/login">← Nazad na prijavu</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
