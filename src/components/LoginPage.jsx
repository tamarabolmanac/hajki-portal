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

      const data = await response.json();
      console.log('Login response:', data); // Debug log
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }
      
      // Store only token in localStorage
      localStorage.setItem('authToken', data.token);
      // We don't have user data in the login response, so we'll fetch it later in Profile component

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
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
