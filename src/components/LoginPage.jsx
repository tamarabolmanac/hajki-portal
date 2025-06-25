import React, { useState } from "react";
import { config } from '../config';
import '../styles/LoginPage.css'

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Molimo vas da unesete podatke.");
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'auth[email]': email,
          'auth[password]': password
        })
      });

      const data = await response.json();
     
      if (data.status !== 200) {
        throw new Error(data.message || 'Invalid credentials');
      }
      debugger
      // Store token and user object in localStorage
      localStorage.setItem('authToken', data.token.token);
      localStorage.setItem('user', JSON.stringify(data.token.user));

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">Prijavite se</h2>
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
          <button type="submit" className="login-button">Prijavite se</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
