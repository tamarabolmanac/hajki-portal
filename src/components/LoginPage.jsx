import React, { useState } from "react";
import { config } from '../config';
import '../styles/LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous errors

    if (!email || !password) {
      setErrorMessage("Molimo vas da unesete podatke.");
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth: { email, password }
        })
      });

      // Check if response is successful first
      if (!response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          // If we can't parse JSON, use generic error
          throw new Error('Greška pri prijavljivanju. Pokušajte ponovo.');
        }
        
        console.log('Login error response:', data); // Debug log
        
        // Handle different error cases based on server response
        let errorMessage = 'Greška pri prijavljivanju. Pokušajte ponovo.';
        
        if (response.status === 401) {
          // Check if error is about unconfirmed email
          if (data.message && data.message.toLowerCase().includes('confirm')) {
            errorMessage = 'Vaš nalog nije potvrđen. Proverite email i kliknite na link za potvrdu.';
          } else {
            errorMessage = 'Korisnik sa ovim email-om ne postoji. Molimo registrujte se prvo.';
          }
        } else if (response.status === 404) {
          errorMessage = 'Korisnik sa ovim email-om ne postoji. Molimo registrujte se prvo.';
        } else if (response.status === 422) {
          errorMessage = 'Neispravni podaci. Proverite format email-a.';
        } else if (response.status === 403) {
          errorMessage = 'Vaš nalog nije potvrđen. Proverite email i kliknite na link za potvrdu.';
        } else if (data.message) {
          // Use server message if available
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // Only parse JSON if response was successful
      const data = await response.json();
      console.log('Login success response:', data); // Debug log
      
      // Check if token exists in response
      if (!data.token) {
        throw new Error('Došlo je do neočekivane greške. Molimo pokušajte ponovo za nekoliko trenutaka.');
      }
      
      // Store only token in localStorage
      localStorage.setItem('authToken', data.token);
      // We don't have user data in the login response, so we'll fetch it later in Profile component

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">Prijavite se</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Unesite svoj email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <br></br>
          <div className="input-group">
            <label htmlFor="password">Lozinka</label>
            <input
              type="password"
              id="password"
              placeholder="Unesite svoju lozinku"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <br></br>
          <button type="submit" className="submit-button button-login">Prijavite se</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
