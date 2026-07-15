import React, { useState } from 'react';
import { config } from '../config';
import { explainUnreachableApiError } from '../utils/fetchErrors';
import { Link } from 'react-router-dom';
import '../styles/Auth.css';
import { useT } from '../i18n/I18nProvider';
import HajkiMark from './HajkiMark';

const Mountain = () => <HajkiMark size={22} />;

const FIELDS = [
  { key: 'name', labelKey: 'reg.name', phKey: 'reg.namePh', type: 'text' },
  { key: 'email', labelKey: 'reg.email', phKey: 'reg.emailPh', type: 'email' },
  { key: 'password', labelKey: 'reg.password', phKey: 'reg.passwordPh', type: 'password' },
  { key: 'confirmPassword', labelKey: 'reg.confirm', phKey: 'reg.confirmPh', type: 'password' },
  { key: 'city', labelKey: 'reg.city', phKey: 'reg.cityPh', type: 'text' },
  { key: 'country', labelKey: 'reg.country', phKey: 'reg.countryPh', type: 'text' },
];

export const Register = () => {
  const { t } = useT();
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
    if (!formData.name.trim()) errors.push(t('reg.errName'));
    if (!formData.email.trim()) errors.push(t('reg.errEmail'));
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) errors.push(t('reg.errEmailFmt'));
    if (!formData.password.trim()) errors.push(t('reg.errPass'));
    else if (formData.password.length < 8) errors.push(t('reg.errPassLen'));
    if (!formData.confirmPassword.trim()) errors.push(t('reg.errConfirm'));
    else if (formData.password !== formData.confirmPassword) errors.push(t('reg.errMismatch'));
    if (!formData.city.trim()) errors.push(t('reg.errCity'));
    if (!formData.country.trim()) errors.push(t('reg.errCountry'));
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
        setMessage(t('reg.success'));
        setMessageType('success');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (response.status === 409) {
            setMessage(data.message || (Array.isArray(data.errors) ? data.errors.join('\n') : t('reg.emailTaken')));
            setMessageType('conflict');
          } else if (response.status === 422) {
            setMessage(Array.isArray(data.errors) ? data.errors.join('\n') : (data.message || t('reg.failed')));
            setMessageType('error');
          } else {
            setMessage(data.message || data.error || t('reg.failed'));
            setMessageType('error');
          }
        } else {
          setMessage(t('reg.failed'));
          setMessageType('error');
        }
      }
    } catch (error) {
      const unreachable = explainUnreachableApiError(error, config.apiUrl);
      setMessage(unreachable || error.message || t('reg.failed'));
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
          <h1>{t('reg.title')}</h1>

          {message && (
            <div className={messageType === 'success' ? 'auth__err' : 'reg-err'}
              style={messageType === 'success' ? { background: '#e6f6ec', border: '1px solid #b7e4c7', color: '#2d6a4f', whiteSpace: 'pre-line' } : { whiteSpace: 'pre-line' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {FIELDS.map(({ key, labelKey, phKey, type }) => (
              <div className="reg-field" key={key}>
                <label>{t(labelKey)}</label>
                <input className="reg-input" type={type} name={key} value={formData[key]} onChange={handleChange} placeholder={t(phKey)} />
              </div>
            ))}
            <button type="submit" className="reg-btn" disabled={submitting}>
              {submitting ? t('reg.submitting') : t('reg.submit')}
            </button>
          </form>

          <p className="reg-foot">{t('reg.haveAccount')} <Link to="/login">{t('reg.login')}</Link></p>
          <p className="reg-foot reg-foot--privacy"><Link to="/privacy-policy">{t('pf.privacy')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
