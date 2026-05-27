import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/api';
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

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
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
            <input
              type="text"
              className="rec-input"
              placeholder="npr. Novi Sad, Zlatibor, Niš..."
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteRecommendation;
