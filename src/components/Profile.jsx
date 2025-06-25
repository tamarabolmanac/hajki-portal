import React, { useState, useEffect } from 'react';
import './Profile.css';
import { config } from '../config';

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Helper function to make authenticated fetch requests
const authenticatedFetch = async (url) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${config.apiUrl}${url}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error in authenticatedFetch:', error);
    throw error;
  }
};

export const Profile = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Get user data from localStorage and parse it as JSON
        const userData = localStorage.getItem('user');
        if (!userData) {
          throw new Error('No user data found');
        }
        const user = JSON.parse(userData);

        // Fetch user details using show endpoint with token
        debugger
        const response = await fetch(`${config.apiUrl}/users/${user.user_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userDetails = await response.json();
        // Store user details directly in localStorage
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        setUserDetails(userDetails);
      } catch (err) {
        setError(`Greška: ${err.message}`);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-container">
        <h2>Učitavanje profila...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <h2>Greška</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="profile-container">
        <h2>Nemate pristup profilu</h2>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Moji podaci</h2>
      <div className="profile-details">
        <div className="profile-field">
          <span className="field-label">Ime:</span>
          <span className="field-value">{userDetails.name}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">Email:</span>
          <span className="field-value">{userDetails.email}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">Uloga:</span>
          <span className="field-value">{userDetails.role}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">Grad:</span>
          <span className="field-value">{userDetails.city}</span>
        </div>
        <div className="profile-field">
          <span className="field-label">Država:</span>
          <span className="field-value">{userDetails.country}</span>
        </div>
      </div>
    </div>
  );
};
