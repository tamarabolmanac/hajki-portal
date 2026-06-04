import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

export const DeleteAccount = () => {
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Nevalidan link.');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/users/confirm_deletion?token=${encodeURIComponent(token)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.clear();
          setStatus('success');
          setMessage(data.message || 'Nalog je uspešno obrisan.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Nevalidan ili istekao link.');
        }
      } catch {
        setStatus('error');
        setMessage('Greška pri povezivanju sa serverom.');
      }
    };

    confirm();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p style={{ color: '#4a5568', fontSize: '1rem' }}>Brisanje naloga u toku...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.75rem' }}>Nalog obrisan</h2>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>{message}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Na početnu
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#2d3748', marginBottom: '0.75rem' }}>Greška</h2>
            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#e2e8f0',
                color: '#2d3748',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Na početnu
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
