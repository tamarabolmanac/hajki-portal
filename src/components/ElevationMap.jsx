import React, { useMemo, useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl, AttributionControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { authenticatedFetch } from '../utils/api';
import { useT } from '../i18n/I18nProvider';
import '../styles/ElevationMap.css';

// Free, no-API-key sources:
// - Basemap: OpenFreeMap "liberty" vector style (https://openfreemap.org)
// - Terrain DEM: AWS-hosted Terrarium tiles (free, no key)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const TERRAIN_TILES = [
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
];
// Esri World Imagery (satellite) — free, no API key. Attribution required.
const SATELLITE_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

const ROUTE_LINE_PAINT = {
  'line-color': '#FF7A00',
  'line-width': 4.5,
};

/**
 * Single MapLibre map for a hike route.
 *  - If the route is "enriched" with elevation → terrain + flat views (toggle on),
 *    plus the elevation profile chart, default to terrain.
 *  - If not enriched → flat map only, toggle disabled, no chart.
 *
 * Props:
 *  - routeId:  hike route id (used to fetch the elevation profile)
 *  - points:   [{ lat, lng }] GPS track to draw
 *  - center:   [{ lat, lng }] fallback location when the route has no track
 */
export default function ElevationMap({ routeId, points = [], center = null }) {
  const { t } = useT();
  const [profile, setProfile] = useState([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mode, setMode] = useState('flat'); // default flat; toggle to terrain when enriched
  const [mapReady, setMapReady] = useState(false);
  const mapObjRef = useRef(null);

  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    (async () => {
      try {
        // authenticatedFetch already returns parsed JSON ({ data, status, message }).
        const data = await authenticatedFetch(`/routes/${routeId}/elevation`);
        if (!cancelled && Array.isArray(data.data)) setProfile(data.data);
      } catch (e) {
        console.warn('Elevation profile unavailable:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [routeId]);

  // "Enriched" = the route's points actually have elevation values.
  const hasElevation = useMemo(() => profile.some((p) => p.elevation != null), [profile]);
  // Two modes: "Mapa" (flat vector) and "Teren" (= 3D satellite).
  const isTerrain = mode === 'terrain';          // "Teren" = satellite + 3D
  const isSatellite = isTerrain;                 // satellite overlay shown in Teren mode
  const terrainOn = isTerrain && hasElevation;   // 3D only when the route has elevation

  // Track to draw: profile (has elevation) → raw points → single center point.
  // Filter out any non-finite coords so the map never gets a NaN LngLat.
  const track = useMemo(() => {
    const raw = profile.length ? profile : (points.length ? points : (center ? [center] : []));
    return raw.filter((p) => p && Number.isFinite(p.lng) && Number.isFinite(p.lat));
  }, [profile, points, center]);

  const lineGeoJSON = useMemo(() => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: track.map((p) => [p.lng, p.lat]), // MapLibre: [lng, lat]
    },
  }), [track]);

  const initialViewState = useMemo(() => {
    const fallback = center && Number.isFinite(center.lng) ? center : { lat: 44.0165, lng: 21.0059 };
    const mid = track[Math.floor(track.length / 2)] || fallback;
    return { longitude: mid.lng, latitude: mid.lat, zoom: track.length > 1 ? 12 : 13, pitch: 0, bearing: 0 };
  }, [track, center]);

  // Re-fit the map to the route. Robust against 3D-terrain projection quirks:
  // compute the camera first, validate it's finite, and fall back to the
  // centroid otherwise — never let fitBounds crash the page with a NaN LngLat.
  const fitToTrack = (map) => {
    if (!map || track.length === 0) return;
    try {
      if (track.length === 1) {
        map.easeTo({ center: [track[0].lng, track[0].lat], zoom: 14, duration: 500 });
        return;
      }
      const lons = track.map((p) => p.lng);
      const lats = track.map((p) => p.lat);
      const sw = [Math.min(...lons), Math.min(...lats)];
      const ne = [Math.max(...lons), Math.max(...lats)];
      const cx = (sw[0] + ne[0]) / 2;
      const cy = (sw[1] + ne[1]) / 2;

      // Degenerate box (all points ~same spot) → just center.
      if (sw[0] === ne[0] && sw[1] === ne[1]) {
        map.easeTo({ center: [cx, cy], zoom: 14, duration: 500 });
        return;
      }
      const cam = map.cameraForBounds([sw, ne], { padding: 28, maxZoom: 16 });
      if (cam && Number.isFinite(cam.center?.lng) && Number.isFinite(cam.center?.lat) && Number.isFinite(cam.zoom)) {
        map.easeTo({ center: cam.center, zoom: cam.zoom, duration: 500 });
      } else {
        map.easeTo({ center: [cx, cy], zoom: 13, duration: 500 });
      }
    } catch (e) {
      console.warn('fitToTrack failed:', e);
    }
  };

  const onLoad = (e) => {
    const map = e.target;
    mapObjRef.current = map;
    // Add the DEM source imperatively so setTerrain() is reliable on toggle.
    if (!map.getSource('terrainSource')) {
      map.addSource('terrainSource', {
        type: 'raster-dem', tiles: TERRAIN_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 15,
      });
    }
    // Ensure the map knows its real container size before fitting, otherwise the
    // first fit is computed against a stale/smaller size and ends up too zoomed-out.
    try { map.resize(); } catch (_) { /* ignore */ }
    fitToTrack(map);
    // Re-fit once layout has fully settled (covers late container sizing).
    setTimeout(() => { try { map.resize(); } catch (_) {} fitToTrack(map); }, 250);
    setMapReady(true);
  };

  // Single source of truth for terrain + pitch → toggling takes one click.
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !mapReady) return;
    try {
      map.setTerrain(terrainOn ? { source: 'terrainSource', exaggeration: 1.4 } : null);
    } catch (_) { /* source not ready yet */ }
    map.easeTo({ pitch: terrainOn ? 60 : 0, duration: 450 });
  }, [terrainOn, mapReady]);

  const hoverPoint = hoverIdx != null ? track[hoverIdx] : null;

  return (
    <div className="elevation-map">
      <div className="elevation-map__canvas">
        <div className="elevation-map__toggle" role="group" aria-label="Vrsta mape">
          <button
            type="button"
            className={isTerrain ? 'is-active' : ''}
            onClick={() => setMode('terrain')}
          >
            {t('map.terrain')}
          </button>
          <button
            type="button"
            className={!isTerrain ? 'is-active' : ''}
            onClick={() => setMode('flat')}
          >
            {t('map.flat')}
          </button>
        </div>
        <button
          type="button"
          className="elevation-map__recenter"
          onClick={() => { const m = mapObjRef.current; if (m) fitToTrack(m); }}
          title={t('map.recenterTitle')}
          aria-label={t('map.recenterTitle')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
          <span>{t('map.recenter')}</span>
        </button>
        <Map
          mapLib={maplibregl}
          initialViewState={initialViewState}
          mapStyle={MAP_STYLE}
          maxPitch={75}
          onLoad={onLoad}
          cooperativeGestures
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Satellite imagery overlay (covers the vector base when active). */}
          <Source id="satellite" type="raster" tiles={SATELLITE_TILES} tileSize={256} attribution="Esri, Maxar, Earthstar Geographics">
            <Layer id="satellite-layer" type="raster" layout={{ visibility: isSatellite ? 'visible' : 'none' }} />
          </Source>

          {track.length > 1 && (
            <Source id="route" type="geojson" data={lineGeoJSON}>
              <Layer id="route-line" type="line" paint={ROUTE_LINE_PAINT}
                layout={{ 'line-cap': 'round', 'line-join': 'round' }} />
            </Source>
          )}

          {track.length > 0 && (
            <Marker longitude={track[0].lng} latitude={track[0].lat} anchor="bottom">
              <div className="elevation-map__pin elevation-map__pin--start">▲</div>
            </Marker>
          )}
          {track.length > 1 && (
            <Marker
              longitude={track[track.length - 1].lng}
              latitude={track[track.length - 1].lat}
              anchor="bottom"
            >
              <div className="elevation-map__pin elevation-map__pin--end">⚑</div>
            </Marker>
          )}

          {hoverPoint && (
            <Marker longitude={hoverPoint.lng} latitude={hoverPoint.lat} anchor="center">
              <div className="elevation-map__cursor" />
            </Marker>
          )}

          <NavigationControl position="top-right" visualizePitch />
          <AttributionControl compact position="bottom-right" />
        </Map>
      </div>

      {hasElevation && (
        <ElevationProfile profile={profile} onHover={setHoverIdx} hoverIdx={hoverIdx} />
      )}
    </div>
  );
}

/** Self-contained SVG area chart of elevation vs. distance. No chart library. */
function ElevationProfile({ profile, onHover, hoverIdx }) {
  const { t } = useT();
  const W = 600;
  const H = 140;
  const PAD = { top: 12, right: 8, bottom: 22, left: 36 };

  const stats = useMemo(() => {
    const withEle = profile.filter((p) => p.elevation != null);
    if (withEle.length < 2) return null;

    const eles = withEle.map((p) => p.elevation);
    const minE = Math.min(...eles);
    const maxE = Math.max(...eles);
    const totalDist = profile[profile.length - 1].distance_m || 0;

    let gain = 0;
    let loss = 0;
    for (let i = 1; i < withEle.length; i++) {
      const d = withEle[i].elevation - withEle[i - 1].elevation;
      if (d > 0) gain += d; else loss += -d;
    }

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const x = (d) => PAD.left + (totalDist ? (d / totalDist) * plotW : 0);
    const y = (e) => PAD.top + plotH - ((e - minE) / (maxE - minE || 1)) * plotH;

    const pts = profile.map((p, i) => ({ i, px: x(p.distance_m), py: p.elevation != null ? y(p.elevation) : null }));
    const linePath = pts.filter((p) => p.py != null).map((p, i) => `${i ? 'L' : 'M'}${p.px},${p.py}`).join(' ');
    const areaPath = `${linePath} L${x(totalDist)},${PAD.top + plotH} L${PAD.left},${PAD.top + plotH} Z`;

    return { minE, maxE, gain, loss, totalDist, pts, linePath, areaPath, plotH, x };
  }, [profile]);

  if (!stats) {
    return <div className="elevation-map__profile elevation-map__profile--empty">{t('ele.unavailable')}</div>;
  }

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let best = Infinity;
    stats.pts.forEach((p) => {
      const dd = Math.abs(p.px - px);
      if (dd < best) { best = dd; nearest = p.i; }
    });
    onHover(nearest);
  };

  const km = (stats.totalDist / 1000).toFixed(1);
  const cursor = hoverIdx != null ? stats.pts[hoverIdx] : null;

  return (
    <div className="elevation-map__profile">
      <div className="elevation-map__stats">
        <span>↑ <strong>{Math.round(stats.gain)} m</strong> {t('ele.ascent')}</span>
        <span>↓ <strong>{Math.round(stats.loss)} m</strong> {t('ele.descent')}</span>
        <span>⛰ <strong>{Math.round(stats.maxE)} m</strong> {t('ele.max')}</span>
        <span>📏 <strong>{km} km</strong></span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="elevation-map__svg"
        onMouseMove={handleMove}
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <linearGradient id="eleFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#11998e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#38ef7d" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={stats.areaPath} fill="url(#eleFill)" />
        <path d={stats.linePath} fill="none" stroke="#11998e" strokeWidth="2" />
        {cursor && cursor.py != null && (
          <>
            <line x1={cursor.px} y1={PAD.top} x2={cursor.px} y2={PAD.top + stats.plotH}
              stroke="#11998e" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={cursor.px} cy={cursor.py} r="4" fill="#11998e" stroke="#fff" strokeWidth="1.5" />
          </>
        )}
      </svg>
      {cursor && profile[hoverIdx] && (
        <div className="elevation-map__readout">
          {Math.round(profile[hoverIdx].elevation)} m · {((profile[hoverIdx].distance_m) / 1000).toFixed(2)} km
        </div>
      )}
    </div>
  );
}
