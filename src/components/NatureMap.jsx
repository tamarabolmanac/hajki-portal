import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { config } from '../config';


const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const MAP_CENTER = { lat: 44.0, lng: 21.0 };
const MAP_ZOOM = 7;

const TYPE_CONFIG = {
  national_park: {
    label: 'Nacionalni park',
    legendLabel: 'nacionalnih parkova',
    color: '#22c55e',
    scale: 9,
  },
  nature_park: {
    label: 'Park prirode',
    legendLabel: 'parkova prirode',
    color: '#3b82f6',
    scale: 7,
  },
  mountain: {
    label: 'Planina',
    legendLabel: 'planina',
    color: '#a855f7',
    scale: 6,
  },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Sve' },
  { key: 'national_park', label: 'Nacionalni parkovi' },
  { key: 'nature_park', label: 'Parkovi prirode' },
  { key: 'mountain', label: 'Planine' },
];

const getMarkerIcon = (type) => {
  const cfg = TYPE_CONFIG[type] || { color: '#888', scale: 6 };
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: cfg.color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: cfg.scale,
  };
};

const NatureMap = () => {
  const [areas, setAreas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetch(`${config.apiUrl}/protected_areas`)
      .then((res) => {
        if (!res.ok) throw new Error('Greška pri učitavanju podataka');
        return res.json();
      })
      .then((data) => {
        setAreas(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredAreas = filter === 'all' ? areas : areas.filter((a) => a.type === filter);

  const counts = {
    national_park: areas.filter((a) => a.type === 'national_park').length,
    nature_park: areas.filter((a) => a.type === 'nature_park').length,
    mountain: areas.filter((a) => a.type === 'mountain').length,
  };

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  const handleMarkerClick = (area) => {
    setSelected(area);
  };

  const handleDeselect = () => {
    setSelected(null);
  };

  const typeLabel = selected ? TYPE_CONFIG[selected.type] : null;

  const dotStyle = (color) => ({
    width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block',
  });

  const filterBtnStyle = (active) => ({
    padding: isMobile ? '4px 10px' : '5px 12px',
    borderRadius: 20,
    border: active ? '2px solid #11998e' : '1px solid #cbd5e0',
    background: active ? '#11998e' : '#ffffff',
    color: active ? '#ffffff' : '#4a5568',
    fontWeight: active ? 700 : 400,
    fontSize: '0.78rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  const typeBadgeStyle = (color) => ({
    display: 'inline-block',
    background: color + '1a',
    color,
    border: `1px solid ${color}55`,
    borderRadius: 12,
    padding: '2px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    marginTop: 6,
    marginBottom: 14,
  });

  // Sadržaj panela (isti za sidebar i bottom sheet)
  const panelContent = selected && (
    <div>
      {/* Slika */}
      {selected.image && (
        <div style={{ width: '100%', height: isMobile ? 180 : 200, overflow: 'hidden', borderRadius: isMobile ? '20px 20px 0 0' : '0' }}>
          <img
            src={selected.image}
            alt={selected.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      <div style={{ padding: isMobile ? '14px 16px 24px' : '18px 18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#134e4a', lineHeight: 1.3, flex: 1 }}>
            {selected.name}
          </h2>
          <button
            onClick={handleDeselect}
            style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#a0aec0', cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1 }}
          >×</button>
        </div>

        {typeLabel && (
          <span style={typeBadgeStyle(TYPE_CONFIG[selected.type].color)}>
            {typeLabel.label}
          </span>
        )}

        {selected.description ? (
          <div style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: 1.7 }}>
            {selected.description.split('\n\n').map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? '0 0 10px' : '10px 0 0' }}>{para}</p>
            ))}
          </div>
        ) : (
          <div style={{
            background: 'rgba(17,153,142,0.04)',
            border: '1px dashed rgba(17,153,142,0.2)',
            borderRadius: 10,
            padding: 14,
            color: '#718096',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}>
            Detalji uskoro...
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingTop: 'var(--app-nav-clearance)' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: isMobile ? '8px 12px' : '10px 16px',
        background: '#fff', borderBottom: '1px solid rgba(17,153,142,0.15)',
        flexWrap: 'wrap',
      }}>
        {/* Legenda — sakri na mobilnom */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginRight: 8 }}>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#4a5568' }}>
                <span style={dotStyle(cfg.color)} />
                {counts[key]} {cfg.legendLabel}
              </span>
            ))}
          </div>
        )}
        {/* Filter dugmici */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map((opt) => (
            <button key={opt.key} style={filterBtnStyle(filter === opt.key)} onClick={() => setFilter(opt.key)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa + sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mapa */}
        <div style={{ flex: 1, height: '100%' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#11998e' }}>
              Učitavanje karte...
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#e53e3e' }}>
              {error}
            </div>
          )}
          {!loading && !error && (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              onLoad={onMapLoad}
              options={{ zoomControl: true, mapTypeControl: false, scaleControl: false, streetViewControl: false, rotateControl: false, fullscreenControl: false }}
            >
              {filteredAreas.map((area, idx) => (
                <Marker
                  key={idx}
                  position={{ lat: area.lat, lng: area.lon }}
                  icon={getMarkerIcon(area.type)}
                  onClick={() => handleMarkerClick(area)}
                />
              ))}
            </GoogleMap>
          )}
        </div>

        {/* DESKTOP — sidebar desno */}
        {!isMobile && (
          <div style={{
            width: 320, background: '#fff',
            borderLeft: '1px solid rgba(17,153,142,0.15)',
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', fontSize: '0.95rem', padding: 24, textAlign: 'center' }}>
                Klikni na tačku na mapi
              </div>
            ) : panelContent}
          </div>
        )}

        {/* MOBILNI — bottom sheet */}
        {isMobile && selected && (
          <>
            {/* Overlay */}
            <div
              onClick={handleDeselect}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 10 }}
            />
            {/* Sheet */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
              zIndex: 20,
              maxHeight: '55vh',
              overflowY: 'auto',
            }}>
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
              </div>
              {panelContent}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NatureMap;
