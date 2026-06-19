import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Polyline, OverlayView } from '@react-google-maps/api';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';
import AppLoader from './AppLoader';
import { BackgroundImage } from './BackgroundImage';
import '../styles/RouteDetails.css';
import '../styles/NavigateRoute.css';

const containerStyle = { width: '100%', height: '100%' };

// Centriraj pulsirajući marker tačno na koordinatu
const centerOverlay = (w, h) => ({ x: -(w / 2), y: -(h / 2) });

export const NavigateRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [routePoints, setRoutePoints] = useState([]);
  const [destination, setDestination] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const watchIdRef = useRef(null);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Auto-zum: drži oba pina (korisnik + odredište/cela ruta) uvek u kadru
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    const pts = [...routePoints];
    if (routePoints.length === 0 && destination) pts.push(destination);
    if (userPos) pts.push(userPos);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setCenter(pts[0]);
      map.setZoom(16);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    pts.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);
  }, [routePoints, destination, userPos]);

  // Učitaj rutu (tačke već stižu sa GET /routes/:id)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await authenticatedFetch(`/routes/${id}`);
        if (cancelled) return;
        const pts = (data.data?.points || []).map((p) => ({ lat: p.lat, lng: p.lng }));
        setRoutePoints(pts);

        // Rute bez GPS putanje: navigiraj do lokacije rute (početne/lokacijske tačke)
        const lat = Number(data.data?.location_latitude);
        const lng = Number(data.data?.location_longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
          setDestination({ lat, lng });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Prati korisnikovu poziciju uživo
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolokacija nije podržana na ovom uređaju.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(`Greška pri lociranju: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loading) return <AppLoader />;

  const mapCenter =
    userPos ||
    (routePoints.length > 0 ? routePoints[0] : destination) ||
    config.mapCenter;

  return (
    <div className="navigate-route-page">
      <div className="route-details-bg">
        <BackgroundImage src="/img/routes-bgd.jpg" alt="" className="route-details-bg-image" fetchPriority="low" />
        <div className="route-details-overlay" />
      </div>

      <div className="navigate-route-content">
        <button className="navigate-route-back" onClick={() => navigate(-1)}>
          ← Nazad
        </button>

        {error && <div className="navigate-route-error">{error}</div>}

        <div className="navigate-route-map">
      {config.googleMapsApiKey ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={15}
          onLoad={onMapLoad}
        >
          {routePoints.length > 1 && (
            <Polyline
              path={routePoints}
              options={{ strokeColor: '#1E66F5', strokeWeight: 5, strokeOpacity: 0.9 }}
            />
          )}

          {routePoints.length > 0 ? (
            <Marker position={routePoints[0]} title="Početak rute" />
          ) : (
            destination && <Marker position={destination} title="Lokacija rute" />
          )}

          {userPos && (
            <OverlayView
              position={userPos}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={centerOverlay}
            >
              <div className="nav-user-dot" title="Vi ste ovde" />
            </OverlayView>
          )}
        </GoogleMap>
      ) : (
        <div style={{ padding: 24 }}>Mapa nije dostupna (nedostaje Google Maps ključ).</div>
      )}
        </div>
      </div>
    </div>
  );
};

export default NavigateRoute;
