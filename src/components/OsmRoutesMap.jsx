import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';

const MAP_CENTER = { lat: 44.0, lng: 21.0 }; // Centar Srbije
const MAP_STYLE  = { width: '100%', height: '100%' };

const OsmRoutesMap = () => {
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState('');

  useEffect(() => {
    fetch(`${config.apiUrl}/osm_routes`)
      .then(r => r.json())
      .then(data => { setRoutes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = routes.filter(r =>
    !filter || r.terrain?.some(t => t.toLowerCase().includes(filter.toLowerCase()))
      || r.name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingTop: 'var(--app-nav-clearance)' }}>

      {/* Toolbar */}
      <div style={{
        padding: '12px 20px', background: 'white',
        borderBottom: '1px solid rgba(17,153,142,0.15)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: 700, color: '#134e4a' }}>
          🗺️ OSM rute u Srbiji
        </span>
        <span style={{
          background: 'rgba(17,153,142,0.1)', color: '#0f766e',
          padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 600
        }}>
          {loading ? '...' : `${filtered.length} / ${routes.length} ruta`}
        </span>
        <input
          type="text"
          placeholder="Filtriraj po imenu ili terenu..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '7px 14px', borderRadius: 20,
            border: '1px solid rgba(17,153,142,0.3)',
            fontSize: 13, outline: 'none', minWidth: 220
          }}
        />
      </div>

      {/* Mapa */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#4a5568' }}>
            Učitavam rute...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_STYLE}
            center={MAP_CENTER}
            zoom={7}
            options={config.mapOptions}
          >
            {filtered.map((route, i) => (
              <Marker
                key={i}
                position={{ lat: route.lat, lng: route.lon }}
                onClick={() => setSelected(route)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 5,
                  fillColor: '#11998e',
                  fillOpacity: 0.8,
                  strokeColor: '#fff',
                  strokeWeight: 1,
                }}
              />
            ))}

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lon }}
                onCloseClick={() => setSelected(null)}
              >
                <div style={{ maxWidth: 220 }}>
                  <strong style={{ color: '#134e4a', fontSize: 14 }}>{selected.name}</strong>
                  {selected.distance_km && (
                    <div style={{ color: '#11998e', fontWeight: 600, marginTop: 4 }}>
                      📍 {selected.distance_km} km
                    </div>
                  )}
                  {selected.terrain?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#4a5568', marginTop: 4 }}>
                      {selected.terrain.join(' · ')}
                    </div>
                  )}
                  {selected.description && (
                    <div style={{ fontSize: 12, color: '#718096', marginTop: 6 }}>
                      {selected.description.slice(0, 120)}{selected.description.length > 120 ? '...' : ''}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  );
};

export default OsmRoutesMap;
