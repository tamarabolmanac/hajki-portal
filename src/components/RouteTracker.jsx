import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { authenticatedFetch } from "../utils/api";
import { config } from "../config";
import {
  addNativeLocationListener,
  addNativeRouteIdListener,
  startNativeTracking,
  stopNativeTracking,
  requestBatteryExemption,
  syncPendingTracking
} from "../tracking/nativeTracker";
import { App } from "@capacitor/app";
import ConfirmModal from "./ConfirmModal";
import recordingGuard from "../utils/recordingGuard";
import { useT } from "../i18n/I18nProvider";
import "../styles/RouteTracker.css";

/** Dark MapLibre style (no API key) matching the Figma record screen. */
const DARK_MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Slučajan v4 UUID; fallback ako WebView nema crypto.randomUUID. */
const genUuid = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) { /* fall through */ }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const fmtElapsed = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

/** Total distance (km) across the rendered GPS points via Haversine. */
const totalDistanceKm = (pts) => {
  if (!pts || pts.length < 2) return 0;
  const R = 6371;
  let km = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    km += 2 * R * Math.asin(Math.sqrt(h));
  }
  return km;
};

/** Uspešan track_point: Rails šalje { status: 200, route_id, point, ... } u JSON telu. */
function isTrackPointSaved(response) {
  if (!response || typeof response !== "object") return false;
  if (response.status === 200) return true;
  if (response.point != null && response.route_id != null) return true;
  return false;
}

export default function RouteTracker({ routeId, onTrackingStart, onTrackingStop, autoStart = false }) {
  const { t } = useT();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [routeToRender, setRouteToRender] = useState([]);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mapRef = useRef(null);
  const routeRef = useRef([]);
  const watchIdRef = useRef(null);
  const flushIntervalRef = useRef(null);
  const nativeLocationListenerRef = useRef(null);
  const nativeRouteIdListenerRef = useRef(null);
  /** Poslednji indeks tačke uspešno sačuvan na serveru (-1 = ništa) */
  const lastSyncedIndexRef = useRef(-1);
  const lastFlushAtRef = useRef(null);
  const isSavingRef = useRef(false);
  const isTrackingRef = useRef(false);
  const currentRouteIdRef = useRef(routeId);
  /** Android: tačke na server šalje HajkiTrackingService; web flush isključen da nema duplikata */
  const nativeBackgroundRef = useRef(false);
  const nativeBackBtnRef = useRef(null);

  const startedKey = routeId ? `tracking:route:${routeId}:started` : null;

  const appendRenderedPoint = useCallback((point) => {
    const renderedPoint = {
      lat: Number(point.lat),
      lng: Number(point.lng),
      accuracy: point.accuracy,
      timestamp: point.timestamp || new Date().toISOString(),
      // Slučajan ID po tački (jednom) → isti kroz sve retry-jeve → server odbija
      // duplikat. Koristi se samo za web slanje; native servis ima svoj client_uuid.
      client_uuid: genUuid(),
    };

    if (!Number.isFinite(renderedPoint.lat) || !Number.isFinite(renderedPoint.lng)) return;

    routeRef.current.push(renderedPoint);
    setRouteToRender([...routeRef.current]);
  }, []);

  /** Šalje sve tačke posle lastSyncedIndexRef (redom). force: ignoriše 5s throttle i čeka mutex. */
  const performFlush = useCallback(async (force) => {
    if (!force) {
      if (isSavingRef.current) return;
      const now = Date.now();
      if (lastFlushAtRef.current != null && now - lastFlushAtRef.current < 5000) return;
    } else {
      let spins = 0;
      while (isSavingRef.current && spins < 100) {
        await new Promise((r) => setTimeout(r, 50));
        spins += 1;
      }
    }
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      while (lastSyncedIndexRef.current < routeRef.current.length - 1) {
        const idx = lastSyncedIndexRef.current + 1;
        const p = routeRef.current[idx];
        console.log("📤 Saving point", idx, "route_id:", currentRouteIdRef.current);
        const response = await authenticatedFetch("/routes/track_point", {
          method: "POST",
          body: JSON.stringify({
            route_id: currentRouteIdRef.current,
            latitude: p.lat,
            longitude: p.lng,
            accuracy: p.accuracy,
            timestamp: p.timestamp,
            client_uuid: p.client_uuid,
          }),
        });

        if (isTrackPointSaved(response)) {
          lastSyncedIndexRef.current = idx;
          if (response.route_id != null) {
            console.log("✅ Point saved! Route ID:", response.route_id);
            currentRouteIdRef.current = response.route_id;
            localStorage.setItem("tracking:active_route_id", String(response.route_id));
          }
        } else {
          console.error("❌ track_point failed:", response);
          break;
        }
      }
    } catch (err) {
      console.error("Error saving tracking point:", err);
      if (force) setError(`Failed to save tracking point: ${err.message}`);
    } finally {
      isSavingRef.current = false;
      lastFlushAtRef.current = Date.now();
    }
  }, []);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    if (nativeLocationListenerRef.current) {
      await nativeLocationListenerRef.current.remove();
      nativeLocationListenerRef.current = null;
    }
    if (nativeRouteIdListenerRef.current) {
      await nativeRouteIdListenerRef.current.remove();
      nativeRouteIdListenerRef.current = null;
    }
    if (nativeBackgroundRef.current) {
      try {
        await stopNativeTracking();
      } catch (e) {
        console.error("stopNativeTracking:", e);
      }
      nativeBackgroundRef.current = false;
    }
    setIsTracking(false);
    isTrackingRef.current = false;
    onTrackingStop && onTrackingStop(currentRouteIdRef.current);
  }, [onTrackingStop]);

  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    nativeBackgroundRef.current = false;

    setRouteToRender([]);
    setElapsed(0);
    routeRef.current = [];
    lastSyncedIndexRef.current = -1;
    lastFlushAtRef.current = null;
    currentRouteIdRef.current = routeId;
    setError(null);
    isSavingRef.current = false;

    // Rekord rute se kreira TEK ovde (lenjo), ako još ne postoji — tako se ruta
    // ne pravi pre nego što korisnik stvarno započne snimanje putanje.
    if (!currentRouteIdRef.current) {
      try {
        const res = await authenticatedFetch("/routes/start_new", { method: "POST" });
        if (res && res.id) {
          currentRouteIdRef.current = res.id;
        } else {
          throw new Error("Nije moguće kreirati rutu za snimanje.");
        }
      } catch (e) {
        console.error("start_new:", e);
        setError(e.message || t('rec.createErr'));
        return;
      }
    }

    setIsTracking(true);
    isTrackingRef.current = true;
    if (startedKey) localStorage.setItem(startedKey, "1");
    if (currentRouteIdRef.current) {
      localStorage.setItem("tracking:active_route_id", String(currentRouteIdRef.current));
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        // Traži izuzeće od battery optimizacija (jednom) — inače battery saver
        // guši pozadinski GPS i ruta ima rupe. Ne blokira snimanje ako se odbije.
        try { await requestBatteryExemption(); } catch (_) { /* best effort */ }

        await startNativeTracking({
          routeId: currentRouteIdRef.current != null ? String(currentRouteIdRef.current) : "",
          apiBaseUrl: config.apiUrl.replace(/\/$/, ""),
          authToken: localStorage.getItem("authToken") || "",
        });
        nativeBackgroundRef.current = true;
        nativeLocationListenerRef.current = await addNativeLocationListener((point) => {
          if (!isTrackingRef.current) return;
          appendRenderedPoint(point);
        });
        nativeRouteIdListenerRef.current = await addNativeRouteIdListener((data) => {
          if (data?.routeId) {
            currentRouteIdRef.current = data.routeId;
            localStorage.setItem("tracking:active_route_id", String(data.routeId));
          }
        });
      } catch (e) {
        console.error("startNativeTracking:", e);
        setError(
          "Ne mogu da pokrenem praćenje u pozadini. U podešavanjima dozvoli lokaciju i notifikacije za Hajki."
        );
        setIsTracking(false);
        isTrackingRef.current = false;
        return;
      }
    }

    onTrackingStart && onTrackingStart();

    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }
    flushIntervalRef.current = setInterval(() => {
      if (isTrackingRef.current && !nativeBackgroundRef.current) void performFlush(false);
    }, 5000);

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!isTrackingRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;

        const newPoint = {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };
        appendRenderedPoint(newPoint);

        if (!nativeBackgroundRef.current) {
          void performFlush(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(`Geolocation error: ${err.message}`);
        void stopTracking();
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );

    watchIdRef.current = id;
  }, [routeId, startedKey, onTrackingStart, stopTracking, performFlush, appendRenderedPoint]);

  const finalizeRoute = async () => {
    const rid = currentRouteIdRef.current;
    if (!rid && routeRef.current.length === 0) return;

    // Native: tačke su na disku (SQLite), a native servis je već označio rutu za
    // finalize. Pokušaj ODMAH da otpremiš + finalizuješ (svež token). Ako nema
    // mreže — ništa se ne gubi: ostaje na disku i sinkuje se pri sledećem
    // otvaranju app-a. Ne zavisi od krhkog WebView-a jer finalize radi native.
    if (nativeBackgroundRef.current) {
      try {
        const res = await syncPendingTracking({
          apiBaseUrl: config.apiUrl,
          authToken: localStorage.getItem("authToken") || "",
        });
        if (res && Number(res.remaining) > 0) {
          alert(t("rec.savedOffline"));
        }
      } catch (e) {
        console.warn("syncPending on stop:", e);
        alert(t("rec.savedOffline"));
      } finally {
        if (startedKey) localStorage.removeItem(startedKey);
        localStorage.removeItem("tracking:active_route_id");
      }
      return;
    }

    // Web (browser) put: flush pa /finalize (kao pre).
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const before = lastSyncedIndexRef.current;
      await performFlush(true);
      if (lastSyncedIndexRef.current >= routeRef.current.length - 1) break;
      if (lastSyncedIndexRef.current === before) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    if (lastSyncedIndexRef.current < routeRef.current.length - 1) {
      setError("Neki GPS podaci nisu uspeli da se sačuvaju pre završetka. Proveri mrežu i pokušaj ponovo.");
    }

    if (!currentRouteIdRef.current) {
      if (startedKey) localStorage.removeItem(startedKey);
      localStorage.removeItem("tracking:active_route_id");
      return;
    }

    try {
      await authenticatedFetch(`/routes/${currentRouteIdRef.current}/finalize`, { method: "POST" });
    } catch (e) {
      console.error("Greška pri finalizaciji rute:", e);
      setError(e.message || "Greška pri finalizaciji rute.");
    } finally {
      if (startedKey) localStorage.removeItem(startedKey);
      localStorage.removeItem("tracking:active_route_id");
    }
  };

  useEffect(() => {
    if (autoStart && !isTrackingRef.current) {
      void startTracking();
    }
    return () => {
      // Safety net: if the screen is torn down while still recording (e.g. an
      // unguarded navigation), finalize so the route never stays stuck in the
      // "tracking" status.
      if (isTrackingRef.current) {
        void finalizeRoute();
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (nativeLocationListenerRef.current) {
        void nativeLocationListenerRef.current.remove();
        nativeLocationListenerRef.current = null;
      }
      if (nativeRouteIdListenerRef.current) {
        void nativeRouteIdListenerRef.current.remove();
        nativeRouteIdListenerRef.current = null;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        void stopNativeTracking();
      }
      nativeBackgroundRef.current = false;
    };
  }, [autoStart, startTracking]);

  // Elapsed timer while recording.
  useEffect(() => {
    if (!isTracking) return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isTracking]);

  // Guard against leaving the screen mid-recording: BottomNav/links go through
  // recordingGuard, and the hardware/browser back button + tab close are caught
  // here. Each shows the "stop recording?" dialog instead of silently aborting.
  useEffect(() => {
    if (!isTracking) {
      recordingGuard.setActive(false);
      recordingGuard.setHandler(null);
      if (nativeBackBtnRef.current) {
        nativeBackBtnRef.current.remove();
        nativeBackBtnRef.current = null;
      }
      return undefined;
    }
    recordingGuard.setActive(true);
    recordingGuard.setHandler(() => setShowLeavePrompt(true));

    window.history.pushState({ hajkiRec: true }, "");
    const onPop = () => {
      window.history.pushState({ hajkiRec: true }, "");
      setShowLeavePrompt(true);
    };
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Android hardware back button / swipe-back gesture fires Capacitor's
    // backButton event, not browser popstate — register it explicitly.
    if (Capacitor.isNativePlatform()) {
      App.addListener("backButton", () => setShowLeavePrompt(true))
        .then((handle) => { nativeBackBtnRef.current = handle; });
    }

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeunload", onBeforeUnload);
      recordingGuard.setActive(false);
      recordingGuard.setHandler(null);
      if (nativeBackBtnRef.current) {
        nativeBackBtnRef.current.remove();
        nativeBackBtnRef.current = null;
      }
    };
  }, [isTracking]);

  // Keep the map centered on the latest GPS point.
  useEffect(() => {
    const map = mapRef.current;
    if (map && routeToRender.length) {
      const last = routeToRender[routeToRender.length - 1];
      try { map.easeTo({ center: [last.lng, last.lat], duration: 600 }); } catch (_) { /* not ready */ }
    }
  }, [routeToRender]);

  const distanceKm = useMemo(() => totalDistanceKm(routeToRender), [routeToRender]);

  const lineGeoJSON = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: routeToRender.map((p) => [p.lng, p.lat]) },
  };
  const start = routeToRender[0];
  const current = routeToRender[routeToRender.length - 1];

  return (
    <div className="rt2">
      {/* Header */}
      <div className="rt2__head">
        <h1 className="rt2__title">{t('rec.title')}</h1>
        {isTracking && (
          <span className="rt2__live"><span className="rt2__live-dot" /> {t('rec.live')}</span>
        )}
      </div>

      {error && <div className="rt2__error">{error}</div>}

      {/* Map */}
      <div className="rt2__map">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={{
            longitude: current ? current.lng : 20.4569,
            latitude: current ? current.lat : 44.8176,
            zoom: 15,
          }}
          mapStyle={DARK_MAP_STYLE}
          cooperativeGestures
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          {routeToRender.length > 1 && (
            <Source id="rt-line" type="geojson" data={lineGeoJSON}>
              <Layer
                id="rt-line-layer"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{ "line-color": "#50C878", "line-width": 4 }}
              />
            </Source>
          )}
          {start && (
            <Marker longitude={start.lng} latitude={start.lat} anchor="center">
              <div className="rt2__pin rt2__pin--start" />
            </Marker>
          )}
          {current && (
            <Marker longitude={current.lng} latitude={current.lat} anchor="center">
              <div className={`rt2__pin ${isTracking ? "rt2__pin--live" : ""}`} />
            </Marker>
          )}
        </Map>

        {!isTracking && (
          <div className="rt2__hint">
            <span className="rt2__hint-dot" /> {t('rec.gpsReady')}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rt2__stats">
        <div className="rt2__stat">
          <p className="rt2__stat-label">{t('rec.time')}</p>
          <p className={`rt2__stat-value ${isTracking ? "" : "rt2__stat-value--off"}`}>{fmtElapsed(elapsed)}</p>
        </div>
        <div className="rt2__stat rt2__stat--right">
          <p className="rt2__stat-label">{t('rec.distance')}</p>
          <p className={`rt2__stat-value ${isTracking ? "" : "rt2__stat-value--off"}`}>
            {distanceKm.toFixed(2)}<span className="rt2__stat-unit">km</span>
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rt2__cta">
        {!isTracking ? (
          <button
            type="button"
            className="rt2__btn rt2__btn--start"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); void startTracking(); }}
          >
            <span className="rt2__btn-ic rt2__btn-ic--circle" /> {t('rec.start')}
          </button>
        ) : (
          <button
            type="button"
            className="rt2__btn rt2__btn--stop"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFinishConfirm(true); }}
          >
            <span className="rt2__btn-ic rt2__btn-ic--square" /> {t('rec.stop')}
          </button>
        )}
      </div>

      <ConfirmModal
        open={showFinishConfirm}
        icon={<span style={{ width: 12, height: 12, borderRadius: 3, background: "#f87171", display: "block" }} />}
        title={t('rec.stopTitle')}
        message={t('rec.stopMsg')}
        confirmLabel={t('rec.stopConfirm')}
        cancelLabel={t('rec.continue')}
        onCancel={() => setShowFinishConfirm(false)}
        onConfirm={async () => {
          setShowFinishConfirm(false);
          await finalizeRoute();
          await stopTracking();
        }}
      />

      <ConfirmModal
        open={showLeavePrompt}
        icon={<span style={{ width: 12, height: 12, borderRadius: 3, background: "#f87171", display: "block" }} />}
        title={t('rec.leaveTitle')}
        message={t('rec.leaveMsg')}
        confirmLabel={t('rec.leaveConfirm')}
        cancelLabel={t('rec.leaveCancel')}
        onCancel={() => setShowLeavePrompt(false)}
        onConfirm={async () => {
          setShowLeavePrompt(false);
          await finalizeRoute();
          await stopTracking();
        }}
      />
    </div>
  );
}
