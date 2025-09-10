import React, { useState } from 'react';
import { config } from '../config';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    city: '',
    country: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      errors.push('Invalid email format');
    }
    
    if (!formData.password.trim()) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!formData.confirmPassword.trim()) {
      errors.push('Confirm password is required');
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    if (!formData.city.trim()) {
      errors.push('City is required');
    }
    
    if (!formData.country.trim()) {
      errors.push('Country is required');
    }
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join('\n'));
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'auth[name]': formData.name,
          'auth[email]': formData.email,
          'auth[password]': formData.password,
          'auth[password_confirmation]': formData.confirmPassword,
          'auth[role]': formData.role,
          'auth[city]': formData.city,
          'auth[country]': formData.country
        })
      });

      // Check if response is successful
      if (response.ok) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          // Store token and user data if provided
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        }
        
        // Show success message and redirect
        setMessage('Registracija je uspešna! Preusmeravamo vas na login stranicu...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Try to parse error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'Registracija neuspešna');
        } else {
          throw new Error('Registracija neuspešna');
        }
      }
    } catch (error) {
      if (error.message.includes('JSON')) {
        setMessage('Registracija je možda uspešna, ali došlo je do greške u komunikaciji. Pokušajte da se prijavite.');
      } else {
        setMessage(error.message);
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Register</h2>
        {message && (
          <div className={message.includes('failed') ? 'error-message' : 'success-message'}>
            {message}
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              className="form-control"
              value={formData.city}
              onChange={handleChange}
              required
              placeholder="Enter your city"
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              className="form-control"
              value={formData.country}
              onChange={handleChange}
              required
              placeholder="Enter your country"
            />
          </div>
          <button type="submit" className="submit-button">
            Register
          </button>
        </form>
        <div className="link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
