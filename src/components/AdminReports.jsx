import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from '../utils/api';
import { BackgroundImage } from './BackgroundImage';
import AppLoader from './AppLoader';
import '../styles/RoutesList.css';

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

export const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/admin/reports');
      setReports(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await authenticatedFetch(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      alert(`Greška: ${err.message}`);
    }
  };

  const deleteRoute = async (id) => {
    if (!window.confirm('Obrisati prijavljenu rutu? Ova akcija je trajna.')) return;
    try {
      await authenticatedFetch(`/admin/reports/${id}/route`, { method: 'DELETE' });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'reviewed' } : r)));
      alert('Ruta je obrisana.');
    } catch (err) {
      alert(`Greška: ${err.message}`);
    }
  };

  return (
    <div className="routes-page">
      <div className="routes-background">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="routes-bg-image" fetchPriority="low" />
        <div className="routes-overlay" />
      </div>
      <div className="page-container">
        <div className="page-header clean">
          <h1>Prijave</h1>
        </div>

        {loading ? (
          <AppLoader title="Učitavanje prijava..." />
        ) : error ? (
          <div className="glass-card"><p style={{ color: '#ffb4b4' }}>{error}</p></div>
        ) : reports.length === 0 ? (
          <div className="glass-card"><p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Nema prijava.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map((r) => (
              <div key={r.id} className="glass-card" style={{ opacity: r.status === 'pending' ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{
                      display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 999,
                      background: r.status === 'pending' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                      color: r.status === 'pending' ? '#ff9b9b' : 'rgba(255,255,255,0.6)',
                      fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem',
                    }}>
                      {STATUS_LABELS[r.status] || r.status}
                    </span>
                    <h3 style={{ margin: '0 0 0.3rem', color: '#fff', fontSize: '1.05rem' }}>
                      {REASON_LABELS[r.reason] || r.reason}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(r.created_at).toLocaleDateString('sr-RS')}
                  </span>
                </div>

                {r.details && (
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', margin: '0.3rem 0 0.75rem' }}>
                    „{r.details}"
                  </p>
                )}

                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>
                  {r.hike_route && <div>📍 Ruta: <strong style={{ color: '#fff' }}>{r.hike_route.title}</strong> (autor: {r.hike_route.author})</div>}
                  {r.reported_user && <div>👤 Korisnik: <strong style={{ color: '#fff' }}>{r.reported_user.name}</strong></div>}
                  <div style={{ marginTop: 4 }}>Prijavio: {r.reporter?.name || `#${r.reporter?.id}`}</div>
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {r.hike_route && (
                      <button onClick={() => deleteRoute(r.id)}
                        style={{ background: 'linear-gradient(135deg,#c62828,#e53935)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                        🗑️ Obriši rutu
                      </button>
                    )}
                    <button onClick={() => setStatus(r.id, 'dismissed')}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Odbaci prijavu
                    </button>
                    <button onClick={() => setStatus(r.id, 'reviewed')}
                      style={{ background: 'rgba(56,239,125,0.15)', color: '#38ef7d', border: '1px solid rgba(56,239,125,0.4)', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                      Označi kao rešeno
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
