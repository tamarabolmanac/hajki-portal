import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationPicker from './LocationPicker';
import { authenticatedFetch } from '../utils/api';
import '../styles/AddForm.css';

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
  const fileInputRef = useRef(null);
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
  
  const fileCount = files && files.length ? files.length : 0;

  return (
    <div className="af-page">
      <div className="af-inner">
        <button type="button" className="af-back" onClick={() => navigate(-1)}>← Nazad</button>
        <h1 className="af-h1">Dodaj novu rutu</h1>

        <form onSubmit={handleSubmit}>
          <div className="af-field">
            <label className="af-label">Naziv</label>
            <input className="af-input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Naziv rute" required />
          </div>

          <div className="af-field">
            <label className="af-label">Opis</label>
            <textarea className="af-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opišite rutu..." required />
          </div>

          <div className="af-field">
            <label className="af-label">Trajanje</label>
            <div className="af-row2">
              <div>
                <input className="af-input" type="text" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value.replace(/\D/g, ''))} placeholder="0" aria-label="Časova" />
                <span className="af-suffix">časova</span>
              </div>
              <div>
                <input className="af-input" type="text" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="0" maxLength={2} aria-label="Minuta" />
                <span className="af-suffix">minuta</span>
              </div>
            </div>
            {(hours !== '' || minutes !== '') && (
              <p className="af-hint">Ukupno: {(parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0)} min</p>
            )}
          </div>

          <div className="af-field">
            <label className="af-label">Težina</label>
            <select className="af-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required>
              <option value="">Izaberi težinu</option>
              <option value="Easy">Laka</option>
              <option value="Moderate">Srednja</option>
              <option value="Difficult">Teška</option>
              <option value="Expert">Napredna</option>
            </select>
          </div>

          <div className="af-field">
            <label className="af-label">Dužina (km)</label>
            <input className="af-input" type="text" inputMode="decimal" value={distance} onChange={(e) => setDistance(normalizeDecimal(e.target.value))} placeholder="npr. 5.5" required />
            {distance && !isNaN(parseFloat(distance)) && <p className="af-hint">{parseFloat(distance).toFixed(2)} km</p>}
          </div>

          <div className="af-field">
            <label className="af-label">Fotografije</label>
            <div
              className="af-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current && fileInputRef.current.click(); } }}
            >
              <span className="af-drop__ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3.5" /></svg>
              </span>
              <span>
                <p className="af-drop__t">{fileCount > 0 ? `${fileCount} ${fileCount === 1 ? 'slika izabrana' : 'slika izabrano'}` : 'Dodajte fotografije'}</p>
                <p className="af-drop__s">Kliknite da izaberete slike</p>
              </span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} style={{ display: 'none' }} />
          </div>

          <div className="af-field">
            <label className="af-label">Lokacija</label>
            <div className="af-loc-row">
              <input className="af-input" type="text" placeholder="Pretraži lokaciju (npr. Kopaonik, Tara...)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyPress} />
              <button type="button" className="af-trazi" onClick={handleSearch}>Traži</button>
            </div>
            {searchResults.length > 0 && (
              <ul className="af-results">
                {searchResults.map((r, idx) => (
                  <li key={idx} onClick={() => handleSelectLocation(r)}>
                    <div className="rn">{r.name}</div>
                    <div className="rc">{r.lat.toFixed(5)}, {r.lng.toFixed(5)}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="af-map">
              <LocationPicker value={selectedLocation} onChange={(lat, lng) => setSelectedLocation({ lat, lng })} />
            </div>
            <p className="af-coords">Izabrano: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          </div>

          <button type="submit" className="af-submit" disabled={isLoading}>
            {isLoading ? <><span className="af-spin" /> Čuvanje...</> : 'Sačuvaj rutu'}
          </button>
          {message && <p className={`af-msg ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default NewRoute;
