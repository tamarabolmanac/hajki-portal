import React, { useState } from 'react';
import SelectableMap from './SelectableMap';
import { config } from '../config';
import '../styles/NewRoute.css';

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
  const [files, setFiles] = useState([]);
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
      // Validate distance
      const distanceValue = parseFloat(distance);
      if (isNaN(distanceValue) || distanceValue <= 0) {
        setMessage("Molimo unesite validnu distancu, veću od 0");
        return;
      }
  
      // Filter duplicate files
      const uniqueFiles = Array.from(files).filter((file, index, self) =>
        index === self.findIndex(f => f.name === file.name && f.size === file.size)
      );
  
      const formData = new FormData();
      formData.append("hike_route[title]", title);
      formData.append("hike_route[description]", description);
      formData.append("hike_route[duration]", (hours * 60) + parseInt(minutes));
      formData.append("hike_route[difficulty]", difficulty);
      formData.append("hike_route[distance]", parseFloat(normalizeDecimal(distance)).toFixed(2));
      formData.append("hike_route[location_latitude]", selectedLocation.lat);
      formData.append("hike_route[location_longitude]", selectedLocation.lng);
  
      uniqueFiles.forEach(file => formData.append("hike_route[images][]", file));
  
      const response = await fetch(`${config.apiUrl}/new_route`, {
        method: "POST",
        body: formData
      });
  
      if (!response.ok) throw new Error("Greška na serveru");
  
      setMessage("Ruta uspešno kreirana!");
      setTitle("");
      setDescription("");
      setHours(0);
      setMinutes(0);
      setDifficulty("");
      setDistance("");
      setSelectedLocation(DEFAULT_LOCATION);
      setFiles([]);
    } catch (err) {
      setMessage("Error: " + err.message);
    }
  };
  
  return (
    <div className="new-route-container">
      <div className="route-form">
        <h2>Dodaj novu rutu</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Naziv:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Opis:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="form-control"
              rows="5"
            ></textarea>
          </div>

          <div className="form-group duration-group">
            <label>Trajanje:</label>
            <div className="duration-inputs">
              <div className="duration-input">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  required
                  className="form-control"
                  min="0"
                  placeholder="Časova"
                />
                <span>časova</span>
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
                  placeholder="Minuta"
                />
                <span>minuta</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Težina:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              className="form-control"
            >
              <option value="">Izaberi težinu</option>
              <option value="Easy">Laka</option>
              <option value="Moderate">Srednja</option>
              <option value="Difficult">Teška</option>
              <option value="Expert">Napredna</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dužina (km):</label>
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
                placeholder="Unesi dužinu u kilometrima"
              />
            </div>
            {distance && (
              <div className="distance-preview">
                <span>{parseFloat(distance).toFixed(2)}</span> km
              </div>
            )}
          </div>

          <div className="form-group">
            <input type="file" multiple onChange={e => setFiles(e.target.files)} /> 
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <div className="map-container">
              <SelectableMap selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
            </div>
          </div>

          <p>
            Izabrano: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>

          <button type="submit" className="submit-button">Sačuvaj rutu</button>
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
