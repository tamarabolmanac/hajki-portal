import React, { useState } from 'react';
import SelectableMap from './SelectableMap';
import { config } from '../config';
import './NewRoute.css';

const DEFAULT_LOCATION = {
  lat: 44.8048,
  lng: 20.4651
};

const normalizeDecimal = (value) => {
  // Replace comma with dot if it exists
  return value.replace(/,/g, '.');
};

export const NewRoute = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [distance, setDistance] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleLocationChange = (lat, lng) => {
    setSelectedLocation({ lat, lng });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
      const results = await response.json();
      setSearchResults(results.map(result => ({
        name: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      })));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
    setSearchResults([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      // Validate distance before sending
      const distanceValue = parseFloat(distance);
      if (isNaN(distanceValue)) {
        setMessage("Please enter a valid distance");
        return;
      }
      if (distanceValue <= 0) {
        setMessage("Distance must be greater than 0");
        return;
      }
      if (distanceValue.toString().length > 10) {
        setMessage("Distance is too large (max 10 digits including decimal point)");
        return;
      }

      const response = await fetch("http://localhost:3000/new_route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title,
          description,
          duration: (hours * 60) + parseInt(minutes), // Convert to total minutes
          difficulty,
          distance: parseFloat(normalizeDecimal(distance)).toFixed(2), // Format to 2 decimal places
          location_latitude: selectedLocation.lat,
          location_longitude: selectedLocation.lng
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create route");
      }

      setMessage("Route created successfully!");
      setTitle("");
      setDescription("");
      setHours(0);
      setMinutes(0);
      setDifficulty("");
      setDistance("");
      setSelectedLocation(DEFAULT_LOCATION);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div className="new-route-container">
      <div className="route-form">
        <h2>Add a New Hiking Route</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="form-control"
              rows="5"
            ></textarea>
          </div>

          <div className="form-group duration-group">
            <label>Duration:</label>
            <div className="duration-inputs">
              <div className="duration-input">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  required
                  className="form-control"
                  min="0"
                  placeholder="Hours"
                />
                <span>h</span>
              </div>
              <div className="duration-input">
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  required
                  className="form-control"
                  min="0"
                  max="59"
                  placeholder="Minutes"
                />
                <span>min</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              className="form-control"
            >
              <option value="">Select difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Difficult">Difficult</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <div className="form-group">
            <label>Distance (km):</label>
            <div className="distance-input">
              <input
                type="number"
                value={distance}
                onChange={(e) => {
                  const value = normalizeDecimal(e.target.value);
                  if (value === '') {
                    setDistance('');
                    return;
                  }
                  const num = parseFloat(value);
                  if (!isNaN(num)) {
                    const totalDigits = value.replace(/[^0-9]/g, '').length;
                    if (totalDigits <= 10) {
                      setDistance(num.toFixed(2));
                    }
                  }
                }}
                required
                className="form-control"
                min="0.01"
                step="0.01"
                placeholder="Enter distance in kilometers"
              />
            </div>
            {distance && (
              <div className="distance-preview">
                <span>{parseFloat(distance).toFixed(2)}</span> km
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <div className="map-container">
              <SelectableMap selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
            </div>
          </div>

          <p>
            Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>

          <button type="submit" className="submit-button">Add Route</button>
          {message && (
            <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewRoute;
