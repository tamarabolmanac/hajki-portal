import React, { useMemo, useState, useEffect, useRef } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { authenticatedFetch } from '../utils/api';
import '../styles/ElevationMap.css';

// Free, no-API-key sources:
// - Basemap: OpenFreeMap "liberty" vector style (https://openfreemap.org)
// - Terrain DEM: AWS-hosted Terrarium tiles (free, no key)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const TERRAIN_TILES = [
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
];

const ROUTE_LINE_PAINT = {
  'line-color': '#FF0000',
  'line-width': 4,
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
  const [profile, setProfile] = useState([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mode, setMode] = useState('terrain'); // user's choice; only applies when enriched
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
  const effectiveMode = hasElevation ? mode : 'flat'; // not enriched → forced flat
  const isTerrain = effectiveMode === 'terrain';

  // Track to draw: profile (has elevation) → raw points → single center point.
  const track = profile.length ? profile : (points.length ? points : (center ? [center] : []));

  const lineGeoJSON = useMemo(() => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: track.map((p) => [p.lng, p.lat]), // MapLibre: [lng, lat]
    },
  }), [track]);

  const initialViewState = useMemo(() => {
    const mid = track[Math.floor(track.length / 2)] || center || { lat: 44.0165, lng: 21.0059 };
    return { longitude: mid.lng, latitude: mid.lat, zoom: track.length > 1 ? 12 : 13, pitch: 0, bearing: 0 };
  }, [track, center]);

  const fitToTrack = (map) => {
    if (track.length >= 2) {
      const lons = track.map((p) => p.lng);
      const lats = track.map((p) => p.lat);
      map.fitBounds(
        [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]],
        { padding: 60, duration: 0 }
      );
    } else if (track.length === 1) {
      map.jumpTo({ center: [track[0].lng, track[0].lat], zoom: 13 });
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
    fitToTrack(map);
    setMapReady(true);
  };

  // Single source of truth for terrain + pitch → toggling takes one click.
  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !mapReady) return;
    try {
      map.setTerrain(isTerrain ? { source: 'terrainSource', exaggeration: 1.4 } : null);
    } catch (_) { /* source not ready yet */ }
    map.easeTo({ pitch: isTerrain ? 60 : 0, duration: 450 });
  }, [isTerrain, mapReady]);

  const hoverPoint = hoverIdx != null ? track[hoverIdx] : null;

  return (
    <div className="elevation-map">
      <div className="elevation-map__canvas">
        <div className="elevation-map__toggle" role="group" aria-label="Vrsta mape">
          <button
            type="button"
            disabled={!hasElevation}
            className={isTerrain ? 'is-active' : ''}
            onClick={() => hasElevation && setMode('terrain')}
          >
            ⛰ Teren
          </button>
          <button
            type="button"
            disabled={!hasElevation}
            className={!isTerrain ? 'is-active' : ''}
            onClick={() => hasElevation && setMode('flat')}
          >
            🗺 Obična mapa
          </button>
        </div>
        <Map
          mapLib={maplibregl}
          initialViewState={initialViewState}
          mapStyle={MAP_STYLE}
          maxPitch={75}
          onLoad={onLoad}
          style={{ width: '100%', height: '100%' }}
        >
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
    return <div className="elevation-map__profile elevation-map__profile--empty">Profil nadmorske visine nije dostupan za ovu rutu.</div>;
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
        <span>↑ <strong>{Math.round(stats.gain)} m</strong> uspon</span>
        <span>↓ <strong>{Math.round(stats.loss)} m</strong> spust</span>
        <span>⛰ <strong>{Math.round(stats.maxE)} m</strong> max</span>
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
