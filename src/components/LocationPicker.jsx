import React, { useRef, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * MapLibre location picker (no API key). Tap or drag the pin to set location;
 * recenters when `value` changes externally (e.g. from the search box).
 */
export default function LocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const lat = Number.isFinite(Number(value?.lat)) ? Number(value.lat) : 44.8048;
  const lng = Number.isFinite(Number(value?.lng)) ? Number(value.lng) : 20.4651;

  useEffect(() => {
    const map = mapRef.current;
    if (map && Number.isFinite(lat) && Number.isFinite(lng)) {
      try { map.easeTo({ center: [lng, lat], duration: 500 }); } catch (_) { /* not ready */ }
    }
  }, [lat, lng]);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      initialViewState={{ longitude: lng, latitude: lat, zoom: 11 }}
      mapStyle={STYLE}
      style={{ width: '100%', height: '100%' }}
      onClick={(e) => onChange(e.lngLat.lat, e.lngLat.lng)}
    >
      <Marker
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        draggable
        onDragEnd={(e) => onChange(e.lngLat.lat, e.lngLat.lng)}
      >
        <div style={{ fontSize: 28, lineHeight: 1, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))', cursor: 'grab' }}>📍</div>
      </Marker>
    </Map>
  );
}
