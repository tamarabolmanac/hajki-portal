import React, { useState, useRef, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { authenticatedFetch } from "../utils/api";
import { config } from "../config";
import {
  addNativeLocationListener,
  addNativeRouteIdListener,
  startNativeTracking,
  stopNativeTracking
} from "../tracking/nativeTracker";
import "../styles/RouteTracker.css";

/** Uspešan track_point: Rails šalje { status: 200, route_id, point, ... } u JSON telu. */
function isTrackPointSaved(response) {
  if (!response || typeof response !== "object") return false;
  if (response.status === 200) return true;
  if (response.point != null && response.route_id != null) return true;
  return false;
}

export default function RouteTracker({ routeId, onTrackingStart, onTrackingStop, autoStart = false }) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [routeToRender, setRouteToRender] = useState([]);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

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

  const startedKey = routeId ? `tracking:route:${routeId}:started` : null;

  const appendRenderedPoint = useCallback((point) => {
    const renderedPoint = {
      lat: Number(point.lat),
      lng: Number(point.lng),
      accuracy: point.accuracy,
      timestamp: point.timestamp || new Date().toISOString(),
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
    onTrackingStop && onTrackingStop();
  }, [onTrackingStop]);

  const startTracking = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    nativeBackgroundRef.current = false;

    setRouteToRender([]);
    routeRef.current = [];
    lastSyncedIndexRef.current = -1;
    lastFlushAtRef.current = null;
    currentRouteIdRef.current = routeId;
    setError(null);
    isSavingRef.current = false;
    setIsTracking(true);
    isTrackingRef.current = true;
    if (startedKey) localStorage.setItem(startedKey, "1");
    if (currentRouteIdRef.current) {
      localStorage.setItem("tracking:active_route_id", String(currentRouteIdRef.current));
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        await startNativeTracking({
          routeId: routeId != null && routeId !== undefined ? String(routeId) : "",
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

    if (!nativeBackgroundRef.current) {
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
    } else {
      await new Promise((r) => setTimeout(r, 1000));
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

  return (
    <div className="route-tracker">
      <div className="route-tracker__panel">
        <h3>Snimanje rute</h3>
        {error && (
          <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
            {error}
          </div>
        )}
        {!isTracking ? (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void startTracking();
            }} 
            style={{ background: "#28a745", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
          >
            Započni snimanje rute
          </button>
        ) : (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowFinishConfirm(true);
            }} 
            style={{ background: "#dc3545", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
          >
            Završi snimanje rute
          </button>
        )}
      </div>

      {showFinishConfirm && (
        <div
          className="nav-confirm-modal-backdrop"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "18px 16px",
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0" }}>Prekid snimanja</h3>
            <p style={{ margin: "0 0 14px 0", color: "#4a5568" }}>
              Da li ste sigurni da želite da završite snimanje rute?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                style={{
                  background: "rgba(15, 23, 42, 0.08)",
                  border: "1px solid rgba(15, 23, 42, 0.15)",
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Nastavi snimanje
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowFinishConfirm(false);
                  await finalizeRoute();
                  await stopTracking();
                }}
                style={{
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Završi i sačuvaj
              </button>
            </div>
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerClassName="route-tracker__map"
        mapContainerStyle={{ height: "100%", width: "100%" }}
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
