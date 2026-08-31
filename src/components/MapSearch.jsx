import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';
import { useT } from '../i18n/I18nProvider';

const MAP_STYLE = { width: '100%', height: '100%' };
const INITIAL_CENTER = { lat: 44.8125, lng: 20.4612 }; // Beograd (fallback pre geolokacije)

// Klasičan "teardrop" map-pin oblik (24×24, vrh na dnu) — uočljiviji od malog kruga.
const PIN_PATH = 'M12 2C7.58 2 4 5.58 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8z';

/** Boja pina po težini rute. */
const diffColor = (d) => {
  const v = (d || '').toLowerCase();
  if (v.includes('hard') || v.includes('teš') || v.includes('tes')) return '#ef4444';
  if (v.includes('eas') || v.includes('lak')) return '#22c55e';
  return '#f59e0b';
};

/**
 * "Pretraga na mapi" — mapa sa pinovima svih ruta (početna tačka svake rute),
 * centrirana na trenutnu lokaciju korisnika, uz pretragu po nazivu mesta (nominatim).
 */
export default function MapSearch() {
  const navigate = useNavigate();
  const { t } = useT();
  const mapRef = useRef(null);
  const userLocRef = useRef(null);

  const [pins, setPins] = useState([]);
  const [selected, setSelected] = useState(null);
  const [userLoc, setUserLoc] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Učitaj sve rute (pinove)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await authenticatedFetch('/routes/map_pins');
        if (!cancelled) setPins(Array.isArray(data?.data) ? data.data : []);
      } catch { /* mapa i dalje radi bez pinova */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Trenutna lokacija → centar mape (preko panTo; ne kontrolišemo center prop da mapa ostane pomerljiva)
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userLocRef.current = c;
        setUserLoc(c);
        if (mapRef.current) { mapRef.current.panTo(c); mapRef.current.setZoom(12); }
      },
      () => { /* ostaje fallback centar */ },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    if (userLocRef.current) { map.panTo(userLocRef.current); map.setZoom(12); }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      const data = await res.json();
      setResults(data.map((r) => ({ name: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
    } catch { setResults([]); }
  };

  const goTo = (loc) => {
    if (mapRef.current) { mapRef.current.panTo({ lat: loc.lat, lng: loc.lng }); mapRef.current.setZoom(12); }
    setQuery(loc.name.split(',')[0]);
    setResults([]);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#0B0F0D' }}>
      {/* toolbar: nazad + pretraga mesta */}
      <div style={{
        position: 'absolute', top: 'calc(var(--app-nav-clearance, 80px) - 12px)', left: 12, right: 12,
        zIndex: 5, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <button
          type="button" onClick={() => navigate(-1)} aria-label={t('rd.back')}
          style={{
            flexShrink: 0, width: 42, height: 42, borderRadius: 12, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(11,15,13,0.85)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>

        <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('map.searchPh')}
            style={{
              width: '100%', height: 42, padding: '0 44px 0 16px', borderRadius: 12, boxSizing: 'border-box',
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(11,15,13,0.85)', color: '#fff',
              fontSize: 15, outline: 'none', WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)',
            }}
          />
          <button
            type="submit" aria-label={t('form.searchBtn')}
            style={{
              position: 'absolute', right: 6, top: 6, width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(56,239,125,0.2)', color: '#38ef7d', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          </button>

          {results.length > 0 && (
            <ul style={{
              position: 'absolute', top: 48, left: 0, right: 0, margin: 0, padding: 6, listStyle: 'none',
              background: 'rgba(11,15,13,0.96)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)', maxHeight: 260, overflowY: 'auto', zIndex: 6,
            }}>
              {results.map((r, i) => (
                <li
                  key={i} onClick={() => goTo(r)}
                  style={{ padding: '10px 12px', color: '#e8fdf2', fontSize: 13, cursor: 'pointer', borderRadius: 8, lineHeight: 1.4 }}
                >
                  {r.name}
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      {/* mapa */}
      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={INITIAL_CENTER}
          zoom={8}
          options={config.mapOptions}
          onLoad={onMapLoad}
          onClick={() => setSelected(null)}
        >
          {userLoc && (
            <Marker
              position={userLoc}
              icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#3b82f6', fillOpacity: 0.95, strokeColor: '#fff', strokeWeight: 2 }}
              zIndex={999}
            />
          )}

          {pins.map((p) => (
            <Marker
              key={p.id}
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => setSelected(p)}
              icon={{
                path: PIN_PATH,
                fillColor: diffColor(p.difficulty),
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1.8,
                scale: 1.8,
                anchor: new window.google.maps.Point(12, 22),
              }}
            />
          ))}

          {selected && (
            <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
              <div style={{ maxWidth: 220 }}>
                <strong style={{ color: '#134e4a', fontSize: 14 }}>{selected.title}</strong>
                <div style={{ fontSize: 12, color: '#4a5568', marginTop: 4 }}>
                  {t(selected.activity_type === 'bike' ? 'form.bike' : 'form.hike')}
                </div>
                <button
                  type="button" onClick={() => navigate(`/route/${selected.id}`)}
                  style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#11998e', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('map.openRoute')}
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
