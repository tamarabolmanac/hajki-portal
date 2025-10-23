import React, { useState, useRef, useEffect } from "react";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import { authenticatedFetch } from "../utils/api";

export default function RouteTracker({ routeId, onTrackingStart, onTrackingStop }) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [routeToRender, setRouteToRender] = useState([]);
  const [pointsSaved, setPointsSaved] = useState(0);
  const [gpsUpdateCount, setGpsUpdateCount] = useState(0);
  const [currentRouteId, setCurrentRouteId] = useState(routeId);

  const routeRef = useRef([]);
  const watchIdRef = useRef(null);
  const lastSavedTimeRef = useRef(null);
  const isSavingRef = useRef(false);
  const isTrackingRef = useRef(false);

  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    setRouteToRender([]);
    routeRef.current = [];
    setPointsSaved(0);
    setGpsUpdateCount(0);
    setError(null);
    isSavingRef.current = false;
    setIsTracking(true);
    isTrackingRef.current = true;
    onTrackingStart && onTrackingStart();

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        if (!isTrackingRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;
        const currentTime = Date.now();
        setGpsUpdateCount((prev) => prev + 1);

        const shouldSavePoint =
          !lastSavedTimeRef.current || currentTime - lastSavedTimeRef.current >= 5000;

        const newPoint = { lat: latitude, lng: longitude };
        routeRef.current.push(newPoint);

        if (shouldSavePoint && !isSavingRef.current) {
          try {
            isSavingRef.current = true;
            const response = await authenticatedFetch("/routes/track_point", {
              method: "POST",
              body: JSON.stringify({
                route_id: currentRouteId,
                latitude,
                longitude,
                accuracy,
                timestamp: new Date().toISOString(),
              }),
            });

            if (response?.status === 200) {
              setPointsSaved((prev) => prev + 1);
              lastSavedTimeRef.current = currentTime;
              if (response.route_id) {
                setCurrentRouteId(response.route_id);
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

  const showRouteOnMap = () => setRouteToRender([...routeRef.current]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
        <h3>Route Tracking</h3>
        {error && (
          <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
            {error}
          </div>
        )}
        {isTracking && (
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            <div>GPS updates: {gpsUpdateCount}</div>
            <div>Points saved: {pointsSaved}</div>
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
            Start Tracking
          </button>
        ) : (
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              stopTracking();
            }} 
            style={{ background: "#dc3545", color: "white", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
          >
            Stop Tracking
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showRouteOnMap();
          }}
          style={{ background: "#007bff", color: "white", marginLeft: "10px", border: "none", padding: "10px 15px", borderRadius: "5px", cursor: "pointer" }}
        >
          Show Route
        </button>
      </div>

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
