import React, { useState, useEffect } from 'react';
import './Profile.css';
import { authenticatedFetch } from '../utils/api';
import LocationTracker from './LocationTracker';


export const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }
        
        const userDetails = await authenticatedFetch('/user_data');
        setUserDetails(userDetails);
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        setName(userDetails?.name || '');
        setCity(userDetails?.city || '');
        setCountry(userDetails?.country || '');
        setAvatarPreview(userDetails?.avatar_url || null);
      } catch (err) {
        setError(`Greška: ${err.message}`);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const onAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const form = new FormData();
      if (name) form.append('name', name);
      if (city) form.append('city', city);
      if (country) form.append('country', country);
      if (avatarFile) form.append('avatar', avatarFile);
      const isDevelopment = process.env.NODE_ENV === 'development';
      const url = isDevelopment ? '/user' : 'https://upload.hajki.com/user';
      const updated = await authenticatedFetch(url, { method: 'PUT', body: form, useProductionUrl: !isDevelopment });
      setUserDetails(updated);
      localStorage.setItem('userDetails', JSON.stringify(updated));
      setAvatarPreview(updated?.avatar_url || null);
      setAvatarFile(null);
      setSavedMsg('Uspešno sačuvano.');
    } catch (err) {
      setError(`Greška: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <h2>Učitavanje profila...</h2>
      </div>
    );
  }

  if (error) {
    // If error is related to authentication, log out the user
    const isAuthError = error.includes('401') || error.includes('Unauthorized') || error.includes('token');
    if (isAuthError) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userDetails');
      window.location.href = '/login';
      return null;
    }
    
    return (
      <div className="profile-container">
        <h2>Greška</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Moji podaci</h2>
      <div className="profile-details">
        <div className="location-section">
          <h3>Moja lokacija</h3>
          <LocationTracker />
        </div>
        <div className="profile-avatar-block">
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar placeholder">{(name || userDetails?.name || '?').slice(0,1).toUpperCase()}</div>
          )}
          <label className="btn-file">
            <input type="file" accept="image/*" onChange={onAvatarChange} />
            Promeni avatar
          </label>
        </div>
        <div className="profile-field">
          <label>Ime:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>Email:</label>
          <span>{userDetails?.email}</span>
        </div>
        <div className="profile-field">
          <label>Uloga:</label>
          <span>{userDetails?.role}</span>
        </div>
        <div className="profile-field">
          <label>Grad:</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>Zemlja:</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="profile-actions">
          <button className="btn-primary-modern" onClick={saveProfile} disabled={saving}>{saving ? 'Čuvanje...' : 'Sačuvaj'}</button>
          {savedMsg && <span className="saved-msg">{savedMsg}</span>}
        </div>
      </div>
    </div>
  );
};
