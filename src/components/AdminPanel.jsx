import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';
import { BackgroundImage } from './BackgroundImage';
import AppLoader from './AppLoader';
import '../styles/RoutesList.css';

// ─── Map Picker ───────────────────────────────────────────────────────────────
// Pretraga preko Nominatim (OpenStreetMap) — identično kao NewRoute. Bez Google
// legacy Places API-ja (koji baca LegacyApiNotActivatedMapError). Mapa je obični
// GoogleMap sa klikom za postavljanje koordinata.
function MapPicker({ lat, lon, onChange }) {
  const mapRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const hasCoords = lat && lon;
  const center = hasCoords
    ? { lat: parseFloat(lat), lng: parseFloat(lon) }
    : { lat: 44.0, lng: 21.0 };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      const data = await res.json();
      setResults(data.map(r => ({
        name: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r) => {
    onChange(r.lat.toFixed(6), r.lng.toFixed(6));
    setQuery(r.name);
    setResults([]);
    if (mapRef.current) mapRef.current.panTo({ lat: r.lat, lng: r.lng });
  };

  const handleMapClick = (e) => {
    onChange(e.latLng.lat().toFixed(6), e.latLng.lng().toFixed(6));
  };

  if (!config.googleMapsApiKey) return (
    <p style={{ color: '#ffb4b4', fontSize: '0.85rem' }}>Google Maps API ključ nije podešen.</p>
  );

  const searchInputStyle = {
    flex: 1, padding: '0.6rem 0.9rem', borderRadius: 8,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Pretraga (Nominatim) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Pretraži lokaciju (npr. Kopaonik, Tara...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
          style={searchInputStyle}
        />
        <button type="button" onClick={handleSearch} disabled={searching}
          style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'rgba(17,153,142,0.2)', border: '1px solid rgba(17,153,142,0.5)', color: '#38ef7d', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          {searching ? '...' : 'Traži'}
        </button>
      </div>

      {results.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 0.5rem', padding: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
          {results.map((r, idx) => (
            <li key={idx} onClick={() => selectResult(r)}
              style={{ padding: '0.6rem 0.9rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', borderBottom: idx < results.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(17,153,142,0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
              <div style={{ color: '#fff', fontSize: '0.88rem' }}>{r.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: 2 }}>{r.lat.toFixed(5)}, {r.lng.toFixed(5)}</div>
            </li>
          ))}
        </ul>
      )}

      {/* Mapa */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 280 }}
          center={center}
          zoom={hasCoords ? 11 : 7}
          onLoad={(map) => { mapRef.current = map; }}
          onUnmount={() => { mapRef.current = null; }}
          onClick={handleMapClick}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {hasCoords && <Marker position={center} />}
        </GoogleMap>
        <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(0,0,0,0.3)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '1.5rem' }}>
          <span>Lat: <strong style={{ color: '#38ef7d' }}>{lat || '—'}</strong></span>
          <span>Lon: <strong style={{ color: '#38ef7d' }}>{lon || '—'}</strong></span>
          <span style={{ marginLeft: 'auto' }}>Klikni na mapu da postaviš koordinate</span>
        </div>
      </div>
    </div>
  );
}

const REASON_LABELS = {
  spam: 'Spam',
  neprikladan_sadrzaj: 'Neprikladan sadržaj',
  uznemiravanje: 'Uznemiravanje',
  netacne_informacije: 'Netačne informacije',
  ostalo: 'Ostalo',
};

const STATUS_LABELS = {
  pending: 'Na čekanju',
  reviewed: 'Rešeno',
  dismissed: 'Odbačeno',
};

const AREA_TYPE_LABELS = {
  national_park: 'Nacionalni park',
  nature_park: 'Park prirode',
  mountain: 'Planina',
};

// ─── Reports Tab ─────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/admin/reports');
      setReports(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    await authenticatedFetch(`/admin/reports/${id}`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const deleteRoute = async (id) => {
    if (!window.confirm('Obrisati prijavljenu rutu?')) return;
    await authenticatedFetch(`/admin/reports/${id}/route`, { method: 'DELETE' });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' } : r));
  };

  if (loading) return <AppLoader title="Učitavanje prijava..." compact />;

  return reports.length === 0 ? (
    <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Nema prijava.</p>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {reports.map(r => (
        <div key={r.id} className="glass-card" style={{ opacity: r.status === 'pending' ? 1 : 0.55, marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 999,
                background: r.status === 'pending' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                color: r.status === 'pending' ? '#ff9b9b' : 'rgba(255,255,255,0.5)',
                fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem',
              }}>
                {STATUS_LABELS[r.status] || r.status}
              </span>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{REASON_LABELS[r.reason] || r.reason}</h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
              {new Date(r.created_at).toLocaleDateString('sr-RS')}
            </span>
          </div>
          {r.details && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>„{r.details}"</p>}
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '0.75rem' }}>
            {r.hike_route && <div>📍 Ruta: <strong style={{ color: '#fff' }}>{r.hike_route.title}</strong> (autor: {r.hike_route.author})</div>}
            {r.reported_user && <div>👤 Korisnik: <strong style={{ color: '#fff' }}>{r.reported_user.name}</strong></div>}
            <div style={{ marginTop: 2 }}>Prijavio: {r.reporter?.name}</div>
          </div>
          {r.status === 'pending' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {r.hike_route && (
                <button onClick={() => deleteRoute(r.id)}
                  style={{ background: 'linear-gradient(135deg,#c62828,#e53935)', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                  🗑️ Obriši rutu
                </button>
              )}
              <button onClick={() => setStatus(r.id, 'dismissed')}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.45rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                Odbaci
              </button>
              <button onClick={() => setStatus(r.id, 'reviewed')}
                style={{ background: 'rgba(56,239,125,0.12)', color: '#38ef7d', border: '1px solid rgba(56,239,125,0.35)', padding: '0.45rem 0.9rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                Rešeno
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Protected Areas Tab ─────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', area_type: 'national_park', lat: '', lon: '', description: '', legacy_image_path: '' };

function ProtectedAreasTab() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);  // null | 'new' | area object
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/protected_areas');
      setAreas(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(EMPTY_FORM); setImageFile(null); setImagePreview(null); setEditing('new'); };
  const openEdit = (a) => {
    setForm({ name: a.name, area_type: a.type, lat: a.lat ?? '', lon: a.lon ?? '', description: a.description ?? '', legacy_image_path: a.image ?? '' });
    setImageFile(null);
    setImagePreview(a.image || null);
    setEditing(a);
  };
  const closeForm = () => { setEditing(null); setImageFile(null); setImagePreview(null); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    try {
      let body;
      let headers = {};

      if (imageFile) {
        // FormData za upload slike — browser sam postavlja Content-Type boundary
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('area_type', form.area_type);
        fd.append('lat', form.lat);
        fd.append('lon', form.lon);
        fd.append('description', form.description);
        fd.append('image', imageFile);
        body = fd;
        // Bez Content-Type — browser ga postavlja automatski sa boundary
      } else {
        body = JSON.stringify({
          name: form.name, area_type: form.area_type,
          lat: form.lat, lon: form.lon,
          description: form.description,
          legacy_image_path: form.legacy_image_path,
        });
        headers = { 'Content-Type': 'application/json' };
      }

      if (editing === 'new') {
        const created = await authenticatedFetch('/protected_areas', { method: 'POST', body, headers });
        setAreas(prev => [...prev, created]);
      } else {
        const updated = await authenticatedFetch(`/protected_areas/${editing.id}`, { method: 'PATCH', body, headers });
        setAreas(prev => prev.map(a => a.id === editing.id ? updated : a));
      }
      closeForm();
    } catch (err) {
      alert(`Greška: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteArea = async (a) => {
    if (!window.confirm(`Obrisati „${a.name}"?`)) return;
    await authenticatedFetch(`/protected_areas/${a.id}`, { method: 'DELETE' });
    setAreas(prev => prev.filter(x => x.id !== a.id));
  };

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.9rem', borderRadius: 8,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box',
  };

  if (loading) return <AppLoader title="Učitavanje..." compact />;

  if (editing) return (
    <div>
      <h3 style={{ color: '#fff', margin: '0 0 1.25rem', fontSize: '1.1rem' }}>
        {editing === 'new' ? '+ Novo zaštićeno područje' : `Izmeni: ${editing.name}`}
      </h3>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <input style={inputStyle} placeholder="Naziv" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <select style={inputStyle} value={form.area_type} onChange={e => setForm(f => ({ ...f, area_type: e.target.value }))}>
          {Object.entries(AREA_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <MapPicker
          lat={form.lat}
          lon={form.lon}
          onChange={(lat, lon) => setForm(f => ({ ...f, lat, lon }))}
        />
        {/* Slika — upload na R2 ili legacy putanja */}
        <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Slika
          </p>
          {imagePreview && (
            <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, marginBottom: '0.5rem' }} />
          )}
          <label style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(17,153,142,0.2)', border: '1px solid rgba(17,153,142,0.5)', color: '#38ef7d', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            📁 Izaberi sliku
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </label>
          {imageFile && <span style={{ marginLeft: '0.75rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>{imageFile.name}</span>}
          {!imageFile && (
            <div style={{ marginTop: '0.5rem' }}>
              <input style={{ ...inputStyle, fontSize: '0.82rem' }} placeholder="ili unesi URL / putanju slike (/img/...)" value={form.legacy_image_path} onChange={e => setForm(f => ({ ...f, legacy_image_path: e.target.value }))} />
            </div>
          )}
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: 200, resize: 'vertical', lineHeight: 1.6 }}
          placeholder="Opis područja..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={save} disabled={saving}
            style={{ background: 'linear-gradient(135deg,#11998e,#38ef7d)', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>
            {saving ? 'Čuvanje...' : '✓ Sačuvaj'}
          </button>
          <button onClick={closeForm}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.65rem 1.5rem', borderRadius: 8, cursor: 'pointer' }}>
            Otkaži
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{areas.length} područja</span>
        <button onClick={openNew}
          style={{ background: 'linear-gradient(135deg,#11998e,#38ef7d)', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
          + Dodaj novo
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {areas.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {a.image && <img src={a.image} alt={a.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{a.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {AREA_TYPE_LABELS[a.type] || a.type}
                {a.description ? ` · ${a.description.slice(0, 60)}…` : ' · bez opisa'}
              </div>
            </div>
            <button onClick={() => openEdit(a)}
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.35rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0 }}>
              Izmeni
            </button>
            <button onClick={() => deleteArea(a)}
              style={{ background: 'transparent', color: 'rgba(255,100,100,0.7)', border: 'none', padding: '0.35rem 0.5rem', borderRadius: 6, cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authenticatedFetch('/settings').then(setSettings).catch(() => setSettings({}));
  }, []);

  const toggle = async (key) => {
    const newValue = !settings[key];
    setSaving(true);
    try {
      await authenticatedFetch('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value: newValue }),
      });
      setSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (err) {
      alert(`Greška: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <AppLoader title="Učitavanje..." compact />;

  const Row = ({ flagKey, title, description }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: 2 }}>{description}</div>
      </div>
      <button
        onClick={() => toggle(flagKey)}
        disabled={saving}
        style={{
          width: 52, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
          background: settings[flagKey] ? 'linear-gradient(135deg,#11998e,#38ef7d)' : 'rgba(255,255,255,0.2)',
          position: 'relative', transition: 'background 0.2s',
        }}
        aria-pressed={!!settings[flagKey]}
      >
        <span style={{
          position: 'absolute', top: 3, left: settings[flagKey] ? 27 : 3,
          width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );

  return (
    <div>
      <Row
        flagKey="show_priroda_srbije"
        title="Priroda Srbije"
        description={'Prikaži stavku „Priroda Srbije" u glavnom meniju (Rute).'}
      />
    </div>
  );
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'areas',    label: '🗺️ Zaštićena područja' },
  { key: 'reports',  label: '⚠️ Prijave' },
  { key: 'settings', label: '⚙️ Podešavanja' },
];

export const AdminPanel = () => {
  const [tab, setTab] = useState('areas');

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>
      <div className="page-container">
        <div className="page-header clean">
          <h1>🛡️ Admin panel</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '0.55rem 1.25rem', borderRadius: 999, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                background: tab === t.key ? 'linear-gradient(135deg,#11998e,#38ef7d)' : 'rgba(255,255,255,0.08)',
                color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.75)',
                border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,0.2)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="glass-card">
          {tab === 'areas'    && <ProtectedAreasTab />}
          {tab === 'reports'  && <ReportsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
