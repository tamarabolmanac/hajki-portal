import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { authenticatedFetch } from '../utils/api';
import { config } from '../config';
import AppLoader from './AppLoader';
import { BackgroundImage } from './BackgroundImage';
import '../styles/RouteDetails.css';
import '../styles/NavigateRoute.css';

// Free, no-key flat basemap (top-down, like the old Google view).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const ROUTE_LINE_PAINT = { 'line-color': '#1E66F5', 'line-width': 5, 'line-opacity': 0.9 };

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

  const onMapLoad = useCallback((e) => {
    mapRef.current = e.target;
  }, []);

  // Auto-zoom: keep both pins (user + destination / whole route) in frame.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pts = [...routePoints];
    if (routePoints.length === 0 && destination) pts.push(destination);
    if (userPos) pts.push(userPos);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: 16 });
      return;
    }

    const lons = pts.map((p) => p.lng);
    const lats = pts.map((p) => p.lat);
    map.fitBounds(
      [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
      { padding: 80, maxZoom: 16, duration: 600 }
    );
  }, [routePoints, destination, userPos]);

  // Load route (points already come from GET /routes/:id).
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

        // Routes without a GPS track: navigate to the route's location point.
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

    return () => { cancelled = true; };
  }, [id]);

  // Track the user's live position.
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolokacija nije podržana na ovom uređaju.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error('Geolocation error:', err);
        setError(`Greška pri lociranju: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const lineGeoJSON = useMemo(() => ({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: routePoints.map((p) => [p.lng, p.lat]) },
  }), [routePoints]);

  if (loading) return <AppLoader />;

  const start = userPos || (routePoints.length > 0 ? routePoints[0] : destination) || config.mapCenter;

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
          <Map
            mapLib={maplibregl}
            initialViewState={{ longitude: start.lng, latitude: start.lat, zoom: 15 }}
            mapStyle={MAP_STYLE}
            onLoad={onMapLoad}
            style={{ position: 'absolute', inset: 0 }}
          >
            {routePoints.length > 1 && (
              <Source id="nav-route" type="geojson" data={lineGeoJSON}>
                <Layer id="nav-route-line" type="line" paint={ROUTE_LINE_PAINT}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
              </Source>
            )}

            {routePoints.length > 0 ? (
              <Marker longitude={routePoints[0].lng} latitude={routePoints[0].lat} anchor="bottom">
                <div className="nav-start-pin" title="Početak rute">▲</div>
              </Marker>
            ) : (
              destination && (
                <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
                  <div className="nav-start-pin" title="Lokacija rute">▲</div>
                </Marker>
              )
            )}

            {userPos && (
              <Marker longitude={userPos.lng} latitude={userPos.lat} anchor="center">
                <div className="nav-user-dot" title="Vi ste ovde" />
              </Marker>
            )}
          </Map>
        </div>
      </div>
    </div>
  );
};

export default NavigateRoute;
