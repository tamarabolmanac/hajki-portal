import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { authenticatedFetch } from "../utils/api";

export default function RouteTracker({ routeId, onTrackingStart, onTrackingStop, autoStart = false }) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [routeToRender, setRouteToRender] = useState([]);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const routeRef = useRef([]);
  const watchIdRef = useRef(null);
  const lastSavedTimeRef = useRef(null);
  const isSavingRef = useRef(false);
  const isTrackingRef = useRef(false);
  const currentRouteIdRef = useRef(routeId);

  const startedKey = routeId ? `tracking:route:${routeId}:started` : null;

  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setRouteToRender([]);
    routeRef.current = [];
    setError(null);
    isSavingRef.current = false;
    setIsTracking(true);
    isTrackingRef.current = true;
    if (startedKey) localStorage.setItem(startedKey, "1");
    if (currentRouteIdRef.current) {
      localStorage.setItem("tracking:active_route_id", String(currentRouteIdRef.current));
    }
    onTrackingStart && onTrackingStart();

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!isTrackingRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;
        const currentTime = Date.now();

        const shouldSavePoint =
          !lastSavedTimeRef.current || currentTime - lastSavedTimeRef.current >= 5000;

        const newPoint = { lat: latitude, lng: longitude };
        routeRef.current.push(newPoint);
        // odmah osveži putanju na mapi
        setRouteToRender([...routeRef.current]);

        if (shouldSavePoint && !isSavingRef.current) {
          try {
            isSavingRef.current = true;
            console.log("📤 Saving point with route_id:", currentRouteIdRef.current);
            const response = await authenticatedFetch("/routes/track_point", {
              method: "POST",
              body: JSON.stringify({
                route_id: currentRouteIdRef.current,
                latitude,
                longitude,
                accuracy,
                timestamp: new Date().toISOString(),
              }),
            });

            if (response?.status === 200) {
              lastSavedTimeRef.current = currentTime;
              if (response.route_id) {
                console.log("✅ Point saved! Route ID:", response.route_id);
                currentRouteIdRef.current = response.route_id;
              }
            }
          } catch (err) {
            console.error("Error saving tracking point:", err);
            setError(`Failed to save tracking point: ${err.message}`);
          } finally {
            isSavingRef.current = false;
          }
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(`Geolocation error: ${err.message}`);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );

    watchIdRef.current = id;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    isTrackingRef.current = false;
    onTrackingStop && onTrackingStop();
  };

  const finalizeRoute = async () => {
    if (!currentRouteIdRef.current) return;
    try {
      await authenticatedFetch(`/routes/${currentRouteIdRef.current}/finalize`, { method: "POST" });
    } catch (e) {
      console.error("Greška pri finalizaciji rute:", e);
      // i dalje zatvaramo snimanje lokalno, ali ostavljamo grešku korisniku
      setError(e.message || "Greška pri finalizaciji rute.");
    } finally {
      if (startedKey) localStorage.removeItem(startedKey);
      localStorage.removeItem("tracking:active_route_id");
    }
  };

  useEffect(() => {
    if (autoStart && !isTrackingRef.current) {
      startTracking();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart]);

  return (
    <div className="route-tracker">
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          background: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
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
              startTracking();
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
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
                  stopTracking();
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
