import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectableMap from './SelectableMap';
import { authenticatedFetch } from '../utils/api';
import { BackgroundImage } from './BackgroundImage';
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
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [distance, setDistance] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
  
    try {
      // Validate distance
      const distanceValue = parseFloat(distance);
      if (isNaN(distanceValue) || distanceValue <= 0) {
        setMessage("Molimo unesite validnu distancu, veću od 0");
        setIsLoading(false);
        return;
      }
  
      // Filter duplicate files
      const uniqueFiles = Array.from(files).filter((file, index, self) =>
        index === self.findIndex(f => f.name === file.name && f.size === file.size)
      );
  
      const formData = new FormData();
      formData.append("hike_route[title]", title);
      formData.append("hike_route[description]", description);
      const h = Math.max(0, parseInt(hours, 10) || 0);
      const mRaw = parseInt(minutes, 10) || 0;
      if (mRaw < 0 || mRaw > 59) {
        setMessage("Minuti moraju biti između 0 i 59");
        setIsLoading(false);
        return;
      }
      formData.append("hike_route[duration]", h * 60 + mRaw);
      formData.append("hike_route[difficulty]", difficulty);
      formData.append("hike_route[distance]", parseFloat(normalizeDecimal(distance)).toFixed(2));
      formData.append("hike_route[location_latitude]", selectedLocation.lat);
      formData.append("hike_route[location_longitude]", selectedLocation.lng);
  
      uniqueFiles.forEach(file => formData.append("hike_route[images][]", file));
  
      const isDevelopment = process.env.NODE_ENV === 'development';
      const url = isDevelopment ? '/new_route' : 'https://upload.hajki.com/new_route';
      
      const data = await authenticatedFetch(url, {
        method: 'POST',
        body: formData,
        useProductionUrl: !isDevelopment,
      });

      // Ako backend vrati ID nove rute, prebaci korisnika na stranicu detalja
      if (data && data.id) {
        navigate(`/route/${data.id}`);
        return;
      }

      // Fallback ako iz nekog razloga nema ID-ja
      setMessage("Ruta uspešno kreirana!");
      setTitle("");
      setDescription("");
      setHours("");
      setMinutes("");
      setDifficulty("");
      setDistance("");
      setSelectedLocation(DEFAULT_LOCATION);
      setFiles([]);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="new-route-container">
      <div className="new-route-bg">
        <BackgroundImage
          src="/img/create-route.jpg"
          alt=""
          className="new-route-bg-image"
          fetchPriority="low"
        />
        <div className="new-route-overlay" />
      </div>
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
                  type="text"
                  inputMode="numeric"
                  value={hours}
                  onChange={(e) => setHours(e.target.value.replace(/\D/g, ''))}
                  className="form-control"
                  placeholder="0"
                  aria-label="Časova"
                />
                <span>časova</span>
              </div>
              <div className="duration-input">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  className="form-control"
                  placeholder="0"
                  maxLength={2}
                  aria-label="Minuta"
                />
                <span>minuta</span>
              </div>
            </div>
            {(hours !== '' || minutes !== '') && (
              <p className="duration-hint">Ukupno: {(parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0)} min</p>
            )}
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
                type="text"
                inputMode="decimal"
                value={distance}
                onChange={(e) => setDistance(normalizeDecimal(e.target.value))}
                required
                className="form-control"
                placeholder="npr. 5.5"
              />
            </div>
            {distance && !isNaN(parseFloat(distance)) && (
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
            <div className="location-search">
              <input
                type="text"
                placeholder="Pretraži lokaciju (npr. Kopaonik, Tara...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="search-input"
              />
              <button type="button" className="search-btn" onClick={handleSearch}>Traži</button>
            </div>
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((r, idx) => (
                  <li key={idx} className="search-item" onClick={() => handleSelectLocation(r)}>
                    <div className="result-name">{r.name}</div>
                    <div className="result-coords">{r.lat.toFixed(5)}, {r.lng.toFixed(5)}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="map-container">
              <SelectableMap selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
            </div>
          </div>

          <p>
            Izabrano: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </p>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Čuvanje...
              </>
            ) : (
              'Sačuvaj rutu'
            )}
          </button>
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
