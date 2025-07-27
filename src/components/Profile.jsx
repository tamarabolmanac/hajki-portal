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
        
        const response = await fetch(`${config.apiUrl}/user_data`, {
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
        setUserDetails(userDetails);
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
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
        <div className="profile-field">
          <label>Ime:</label>
          <span>{userDetails?.name}</span>
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
          <span>{userDetails?.city}</span>
        </div>
        <div className="profile-field">
          <label>Zemlja:</label>
          <span>{userDetails?.country}</span>
        </div>
      </div>
    </div>
  );
};
