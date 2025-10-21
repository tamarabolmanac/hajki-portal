import React, { useState } from 'react';
import { config } from '../config';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { Link } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${config.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userID', data.user_id);
      // Redirect to home page
      navigate('/');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {message && (
          <div className={message.includes('Login failed') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="submit-button">
            Login
          </button>
        </form>
        <div className="link">
          Don't have an account? <a href="/register">Register</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
