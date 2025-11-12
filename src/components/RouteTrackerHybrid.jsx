import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";

import {
  startBackgroundTracking,
  stopBackgroundTracking,
  getNativeRoute,
} from '../tracking/backgroundTracking';

import {
  startBrowserTracking,
  stopBrowserTracking,
  getBrowserRoute,
} from '../tracking/browserTracking';

export default function RouteTrackerHybrid({ routeId, onTrackingStart, onTrackingStop }) {
  console.log("IS NATIVE PLATFORM?", Capacitor.isNativePlatform());
    const isNative = Capacitor.isNativePlatform();

  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [gpsUpdateCount, setGpsUpdateCount] = useState(0);
  const [pointsSaved, setPointsSaved] = useState(0);
  const [routeToRender, setRouteToRender] = useState([]);

  const startTracking = async () => {
    setIsTracking(true);
    setError(null);
    setGpsUpdateCount(0);
    setPointsSaved(0);
    setRouteToRender([]);

    if (isNative) {
      await startBackgroundTracking(
        routeId,
        (response) => {
          console.log("✅ Native point saved:", response);
          setGpsUpdateCount(prev => prev + 1);
          setPointsSaved(prev => prev + 1);
        },
        (err) => {
          console.error("❌ Native tracking error:", err);
          setError(err.message || err.toString());
        }
      );
    } else {
      await startBrowserTracking(
        routeId,
        (newPoint) => {
          setGpsUpdateCount(prev => prev + 1);
          setPointsSaved(prev => prev + 1);
        },
        (errMsg) => setError(errMsg)
      );
    }

    onTrackingStart && onTrackingStart();
  };

  const stopTracking = async () => {
    setIsTracking(false);

    if (isNative) {
      await stopBackgroundTracking();
      setRouteToRender(getNativeRoute());
    } else {
      stopBrowserTracking();
      setRouteToRender(getBrowserRoute());
    }

    onTrackingStop && onTrackingStop();
  };

  const showRouteOnMap = () => {
    if (isNative) {
      setRouteToRender(getNativeRoute());
    } else {
      setRouteToRender(getBrowserRoute());
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isNative) stopBrowserTracking();
    };
  }, [isNative]);

  return (
    <div className="page-container">
      <div className="page-header clean">
        <h1>GPS Tracking</h1>
        <p style={{ marginTop: '0.5rem', fontSize: '1rem', opacity: 0.9 }}>
          {isNative ? 'Native tracking (background mode)' : 'Browser tracking'}
        </p>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2.5rem' }}>
        
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#b71c1c',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            ❌ {error}
          </div>
        )}

        {isTracking && (
          <div style={{
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '1.1rem',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
          }}>
            🔴 Tracking u toku... GPS aktiviran
            <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
              GPS updates: {gpsUpdateCount} • Points saved: {pointsSaved}
            </div>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.8rem', fontWeight: '700' }}>
            Započni snimanje rute
          </h2>
          <p style={{ marginBottom: '0', opacity: 0.8, lineHeight: '1.6' }}>
            Klikni "Start tracking" da započneš snimanje GPS koordinata tvoje rute. 
            Aplikacija će pratiti tvoju lokaciju tokom planinarenja.
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          marginTop: '2.5rem'
        }}>
          <button 
            className="btn-primary-modern" 
            onClick={startTracking}
            disabled={isTracking}
            style={{ 
              minWidth: '200px',
              fontSize: '1.1rem',
              padding: '14px 28px',
              opacity: isTracking ? 0.5 : 1,
              cursor: isTracking ? 'not-allowed' : 'pointer'
            }}
          >
            {isTracking ? '✅ Tracking aktivan' : '🚀 Start tracking'}
          </button>

          <button 
            className="btn-secondary-modern" 
            onClick={stopTracking}
            disabled={!isTracking}
            style={{ 
              minWidth: '200px',
              fontSize: '1.1rem',
              padding: '14px 28px',
              background: !isTracking ? '#ccc' : '#f44336',
              color: 'white',
              border: 'none',
              cursor: !isTracking ? 'not-allowed' : 'pointer'
            }}
          >
            ⏹️ Stop tracking
          </button>

          {/* show route button like original */}
          <button
            type="button"
            onClick={showRouteOnMap}
            style={{ 
              minWidth: '200px',
              fontSize: '1.1rem',
              padding: '14px 28px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📌 Show Route
          </button>
        </div>

        <div style={{ 
          marginTop: '2.5rem', 
          padding: '1.5rem', 
          background: 'rgba(17, 153, 142, 0.1)',
          borderRadius: '12px',
          fontSize: '0.95rem',
          lineHeight: '1.6'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>💡 Saveti:</p>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', textAlign: 'left' }}>
            <li>Dozvoli pristup lokaciji za najbolje rezultate</li>
            <li>Drži aplikaciju otvorenu tokom snimanja</li>
            <li>GPS najbolje radi na otvorenom prostoru</li>
          </ul>
        </div>
      </div>

      {/* Google map render */}
      <GoogleMap
        mapContainerStyle={{ height: "100vh", width: "100%" }}
        center={
          routeToRender.length
            ? routeToRender[routeToRender.length - 1]
            : { lat: 44.8176, lng: 20.4569 }
        }
        zoom={15}
      >
        {routeToRender.length > 1 && (
          <Polyline path={routeToRender} options={{ strokeColor: "#FF0000", strokeWeight: 4 }} />
        )}
        {routeToRender.length > 0 && (
          <>
            <Marker position={routeToRender[0]} />
            <Marker position={routeToRender[routeToRender.length - 1]} />
          </>
        )}
      </GoogleMap>
    </div>
  );
}
