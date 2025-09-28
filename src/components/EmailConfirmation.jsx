import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { config } from '../config';
import '../styles/EmailConfirmation.css';

export const EmailConfirmation = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      // Get token from URL params (/confirm/:token) or query string (/confirm?token=...)
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get('token');
      const finalToken = token || queryToken;
      
      if (!finalToken) {
        setMessage('Neispravan link za potvrdu.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/users/confirm/${finalToken}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Email je uspešno potvrđen! Sada možete da se prijavite.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setMessage(data.message || 'Greška pri potvrdi email-a. Link je možda istekao.');
        }
      } catch (error) {
        setMessage('Došlo je do greške. Pokušajte ponovo.');
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmail();
  }, [token, navigate]);

  return (
    <div className="email-confirmation-container">
      <div className="confirmation-content">
        <h2>Potvrda email adrese</h2>
        {isLoading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Potvrđujemo vaš email...</p>
          </div>
        ) : (
          <div className={`message ${message.includes('uspešno') ? 'success' : 'error'}`}>
            <p>{message}</p>
            {message.includes('uspešno') && (
              <p className="redirect-info">Preusmeravamo vas na stranicu za prijavu...</p>
            )}
            {!message.includes('uspešno') && (
              <div className="action-links">
                <a href="/register">Registruj se ponovo</a>
                <a href="/login">Idi na prijavu</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
