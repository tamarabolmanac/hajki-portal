import React, { useState } from 'react';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';

const Mountain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
);

const FIELDS = [
  { key: 'name', label: 'Ime', placeholder: 'Unesi svoje ime', type: 'text' },
  { key: 'email', label: 'Email', placeholder: 'Unesi svoj email', type: 'email' },
  { key: 'password', label: 'Lozinka', placeholder: 'Unesi lozinku', type: 'password' },
  { key: 'confirmPassword', label: 'Potvrda lozinke', placeholder: 'Potvrdi lozinku', type: 'password' },
  { key: 'city', label: 'Grad', placeholder: 'Unesi grad', type: 'text' },
  { key: 'country', label: 'Država', placeholder: 'Unesi državu', type: 'text' },
];

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'user', city: '', country: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Ime je obavezno');
    if (!formData.email.trim()) errors.push('Email je obavezan');
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) errors.push('Neispravan email format');
    if (!formData.password.trim()) errors.push('Lozinka je obavezna');
    else if (formData.password.length < 8) errors.push('Lozinka mora da sadrži najmanje 8 karaktera');
    if (!formData.confirmPassword.trim()) errors.push('Potvrda lozinke je obavezna');
    else if (formData.password !== formData.confirmPassword) errors.push('Lozinke se ne poklapaju');
    if (!formData.city.trim()) errors.push('Grad je obavezan');
    if (!formData.country.trim()) errors.push('Država je obavezna');
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setMessage(validationErrors.join('\n'));
      setMessageType('error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'auth[name]': formData.name,
          'auth[email]': formData.email,
          'auth[password]': formData.password,
          'auth[password_confirmation]': formData.confirmPassword,
          'auth[role]': formData.role,
          'auth[city]': formData.city,
          'auth[country]': formData.country,
        }),
      });
      if (response.ok) {
        setMessage('Registracija je uspešna! Proverite email i kliknite na link za potvrdu da aktivirate nalog.');
        setMessageType('success');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (response.status === 409) {
            setMessage(data.message || (Array.isArray(data.errors) ? data.errors.join('\n') : 'Email je već zauzet'));
            setMessageType('conflict');
          } else if (response.status === 422) {
            setMessage(Array.isArray(data.errors) ? data.errors.join('\n') : (data.message || 'Registracija neuspešna'));
            setMessageType('error');
          } else {
            setMessage(data.message || data.error || 'Registracija neuspešna');
            setMessageType('error');
          }
        } else {
          setMessage('Registracija neuspešna');
          setMessageType('error');
        }
      }
    } catch (error) {
      const unreachable = explainUnreachableApiError(error, config.apiUrl);
      setMessage(unreachable || error.message || 'Registracija neuspešna');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth auth--register">
      <div className="auth__wrap">
        <div className="auth__logo"><Mountain /><span>Hajki</span></div>

        <div className="reg-card">
          <h1>Registracija</h1>

          {message && (
            <div className={messageType === 'success' ? 'auth__err' : 'reg-err'}
              style={messageType === 'success' ? { background: '#e6f6ec', border: '1px solid #b7e4c7', color: '#2d6a4f', whiteSpace: 'pre-line' } : { whiteSpace: 'pre-line' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {FIELDS.map(({ key, label, placeholder, type }) => (
              <div className="reg-field" key={key}>
                <label>{label}</label>
                <input className="reg-input" type={type} name={key} value={formData[key]} onChange={handleChange} placeholder={placeholder} />
              </div>
            ))}
            <button type="submit" className="reg-btn" disabled={submitting}>
              {submitting ? 'Registracija...' : 'Registruj se'}
            </button>
          </form>

          <p className="reg-foot">Već imaš nalog? <Link to="/login">Uloguj se</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
