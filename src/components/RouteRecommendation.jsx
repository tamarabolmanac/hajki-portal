import React, { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';
import './RouteRecommendation.css';

const TAGS = [
  'Reka', 'Planina', 'Trim staza', 'Jezero',
  'Šuma', 'Divljina', 'Betonirana staza', 'Urbana sredina', 'Biciklistička staza',
];

const RouteRecommendation = () => {
  const [distanceMin, setDistanceMin] = useState(0);
  const [distanceMax, setDistanceMax] = useState(20);
  const [selectedTags, setSelectedTags] = useState([]);
  const [location, setLocation] = useState('');
  const [destinations, setDestinations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locatingFor, setLocatingFor] = useState(null);
  const [activeMap, setActiveMap] = useState(null); // { index, url }
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const debounceRef = useRef(null);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleLocationChange = (value) => {
    setLocation(value);
    setLocationSuggestions([]);
    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=rs`
        );
        const data = await res.json();
        setLocationSuggestions(data.map(r => r.display_name));
      } catch {
        setLocationSuggestions([]);
      }
    }, 350);
  };

  const handleSelectSuggestion = (suggestion) => {
    setLocation(suggestion);
    setLocationSuggestions([]);
  };

  const handleOpenMap = (dest, index) => {
    // Ako je ista karta već otvorena — zatvori je
    if (activeMap?.index === index) {
      setActiveMap(null);
      return;
    }

    const apiKey = config.googleMapsApiKey;
    setLocatingFor(index);

    const showMap = (originLat, originLon) => {
      let url;
      if (originLat && originLon) {
        url = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${originLat},${originLon}&destination=${dest.lat},${dest.lon}&mode=walking&language=sr`;
      } else {
        url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${dest.lat},${dest.lon}&language=sr`;
      }
      setActiveMap({ index, url });
      setLocatingFor(null);
    };

    if (!navigator.geolocation) {
      showMap(null, null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => showMap(pos.coords.latitude, pos.coords.longitude),
      () => showMap(null, null)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDestinations(null);

    try {
      const data = await authenticatedFetch('/recommendations', {
        method: 'POST',
        body: JSON.stringify({
          distance_min: distanceMin,
          distance_max: distanceMax,
          tags: selectedTags,
          location,
        }),
      });

      try {
        const parsed = JSON.parse(data.recommendation);
        setDestinations(parsed);
      } catch {
        throw new Error('Agent nije vratio ispravan odgovor. Pokušaj ponovo.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommendation-page">
      <div className="recommendation-container">
        <div className="recommendation-header">
          <h1 className="recommendation-title">Preporuka za šetnju</h1>
          <p className="recommendation-desc">
            Želeli biste da nađete najbolju opciju za sebe ili svoju ekipu?
            Unesite nekoliko kriterijuma i otkrijte idealnu destinaciju na teritoriji Republike Srbije.
          </p>
        </div>

        <form className="recommendation-form glass-card" onSubmit={handleSubmit}>

          {/* Distance range */}
          <div className="rec-field">
            <label className="rec-label">
              Željena dužina staze
              <span className="rec-range-value">{distanceMin} – {distanceMax} km</span>
            </label>
            <div className="rec-range-row">
              <span className="rec-range-hint">0 km</span>
              <div className="rec-sliders">
                <input
                  type="range" min={0} max={100} step={1}
                  value={distanceMin}
                  onChange={e => setDistanceMin(Math.min(Number(e.target.value), distanceMax - 1))}
                  className="rec-slider rec-slider--min"
                />
                <input
                  type="range" min={0} max={100} step={1}
                  value={distanceMax}
                  onChange={e => setDistanceMax(Math.max(Number(e.target.value), distanceMin + 1))}
                  className="rec-slider rec-slider--max"
                />
              </div>
              <span className="rec-range-hint">100 km</span>
            </div>
          </div>

          {/* Tags */}
          <div className="rec-field">
            <label className="rec-label">Tip terena</label>
            <div className="rec-tags">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`rec-tag ${selectedTags.includes(tag) ? 'rec-tag--active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="rec-field">
            <label className="rec-label">Blizu lokacije</label>
            <div className="rec-location-wrap">
              <input
                type="text"
                className="rec-input"
                placeholder="npr. Novi Sad, Zlatibor, Niš..."
                value={location}
                onChange={e => handleLocationChange(e.target.value)}
                autoComplete="off"
              />
              {locationSuggestions.length > 0 && (
                <ul className="rec-suggestions">
                  {locationSuggestions.map((s, i) => (
                    <li key={i} className="rec-suggestion-item" onClick={() => handleSelectSuggestion(s)}>
                      📍 {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary-modern rec-submit" disabled={loading}>
            {loading ? 'Tražim preporuke...' : 'Pronađi destinaciju'}
          </button>
        </form>

        {/* Result */}
        {loading && (
          <div className="rec-loading glass-card">
            <div className="rec-spinner" />
            <p>Agent pretražuje destinacije za tebe...</p>
          </div>
        )}

        {error && (
          <div className="rec-error glass-card">
            <p>⚠️ {error}</p>
          </div>
        )}

        {destinations && (
          <div className="rec-results">
            <h2 className="rec-results-title">Preporučene destinacije</h2>
            {destinations.map((dest, i) => (
              <div key={i} className="rec-card glass-card">
                <div className="rec-card-header">
                  <span className="rec-card-number">{i + 1}</span>
                  <h3 className="rec-card-name">{dest.name}</h3>
                  <span className="rec-card-distance">📍 {dest.distance}</span>
                </div>
                <p className="rec-card-description">{dest.description}</p>
                {dest.why && (
                  <p className="rec-card-why">
                    <span className="rec-card-why-label">Zašto odgovara:</span> {dest.why}
                  </p>
                )}
                {dest.lat && dest.lon && (
                  <>
                    <button
                      className={`rec-card-map-btn ${activeMap?.index === i ? 'rec-card-map-btn--active' : ''}`}
                      onClick={() => handleOpenMap(dest, i)}
                      disabled={locatingFor === i}
                    >
                      {locatingFor === i
                        ? '📍 Tražim lokaciju...'
                        : activeMap?.index === i
                          ? '✕ Zatvori mapu'
                          : '🗺️ Vidi na mapi'}
                    </button>
                    {activeMap?.index === i && (
                      <div className="rec-card-map">
                        <iframe
                          title={`Mapa — ${dest.name}`}
                          src={activeMap.url}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteRecommendation;
