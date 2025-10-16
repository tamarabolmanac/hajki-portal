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
  
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

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
          
          // Set existing images
          if (data.data.image_urls && data.data.image_urls.length > 0) {
            setExistingImages(data.data.image_urls);
          }
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeSelectedImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add route data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(`hike_route[${key}]`, formData[key]);
        }
      });

      // Add new images
      selectedImages.forEach((image, index) => {
        formDataToSend.append(`hike_route[images][]`, image);
      });

      // Add existing images to keep (as URLs)
      existingImages.forEach((imageUrl, index) => {
        formDataToSend.append(`hike_route[existing_images][]`, imageUrl);
      });

      const response = await authenticatedFetch(`/routes/${id}`, {
        method: 'PUT',
        body: formDataToSend,
        // Don't set Content-Type header, let browser set it for FormData
        headers: {
          // Remove Content-Type to let browser set boundary for FormData
        }
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

        {/* Images Section */}
        <div className="form-section">
          <h3>Slike rute</h3>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <h4>Postojeće slike:</h4>
              <div className="images-grid">
                {existingImages.map((imageUrl, index) => (
                  <div key={index} className="image-preview">
                    <img src={imageUrl} alt={`Route image ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeExistingImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Images Upload */}
          <div className="new-images">
            <label htmlFor="images">Dodaj nove slike:</label>
            <input
              type="file"
              id="images"
              name="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
            
            {selectedImages.length > 0 && (
              <div className="selected-images">
                <h4>Nove slike za upload:</h4>
                <div className="images-grid">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="image-preview">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`New image ${index + 1}`} 
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeSelectedImage(index)}
                      >
                        ✕
                      </button>
                      <span className="image-name">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
