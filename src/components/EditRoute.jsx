import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import '../styles/EditRoute.css';

export const EditRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    duration: '',
    distance: '',
    best_time_to_visit: ''
  });

  // Load route data
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        const data = await authenticatedFetch(`/routes/${id}`);
        
        if (data && data.data) {
          setRoute(data.data);
          setFormData({
            title: data.data.title || '',
            description: data.data.description || '',
            difficulty: data.data.difficulty || 'easy',
            duration: data.data.duration || '',
            distance: data.data.distance || '',
            best_time_to_visit: data.data.best_time_to_visit || ''
          });
        }
      } catch (err) {
        setError('Failed to load route data');
        console.error('Error loading route:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoute();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const response = await authenticatedFetch(`/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          hike_route: formData
        })
      });

      if (response && response.status === 200) {
        // Redirect back to route details
        navigate(`/routes/${id}`);
      } else {
        setError('Failed to update route');
      }
    } catch (err) {
      setError('Error updating route: ' + err.message);
      console.error('Error updating route:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/routes/${id}`);
  };

  if (loading) {
    return (
      <div className="edit-route-container">
        <div className="loading">Loading route data...</div>
      </div>
    );
  }

  if (error && !route) {
    return (
      <div className="edit-route-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="edit-route-container">
      <div className="edit-route-header">
        <h1>Edit Route</h1>
        <p>Update the details of your hiking route</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-route-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="title">Route Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter route title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Describe your hiking route..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes)</label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              min="0"
              placeholder="120"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="distance">Distance (km)</label>
            <input
              type="number"
              id="distance"
              name="distance"
              value={formData.distance}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              placeholder="5.2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="best_time_to_visit">Best Time to Visit</label>
            <input
              type="text"
              id="best_time_to_visit"
              name="best_time_to_visit"
              value={formData.best_time_to_visit}
              onChange={handleInputChange}
              placeholder="Spring, Summer"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
