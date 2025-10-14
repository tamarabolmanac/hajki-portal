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

  // Ref za prikupljene tačke (ne renderuju se odmah)
  const routeRef = useRef([]);
  const watchIdRef = useRef(null);
  const lastSavedTimeRef = useRef(null);
  const isTrackingRef = useRef(false);

  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser");
      return;
    }

    // Reset state i ref
    setRouteToRender([]);
    routeRef.current = [];
    setPointsSaved(0);
    setGpsUpdateCount(0);
    lastSavedTimeRef.current = null;
    setError(null);
    setIsTracking(true);
    isTrackingRef.current = true;
    
    // Reset route ID for new tracking sessions (only if we started with null)
    if (routeId === null) {
      setCurrentRouteId(null);
    }
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

        // Dodaj u ref, ali ne u state za render
        routeRef.current.push(newPoint);

        if (shouldSavePoint) {
          try {
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

            if (response && response.status === 200) {
              lastSavedTimeRef.current = currentTime;
              setPointsSaved((prev) => prev + 1);
              
              // If this was the first point and we got a route_id back, save it
              if (!currentRouteId && response.route_id) {
                setCurrentRouteId(response.route_id);
                console.log("New route created with ID:", response.route_id);
              }
            } else {
              console.error("Failed to save point:", response);
            }
          } catch (err) {
            console.error("Error saving tracking point:", err);
            setError(`Failed to save tracking point: ${err.message}`);
          }
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(`Geolocation error: ${err.message}`);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );

    watchIdRef.current = id;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    isTrackingRef.current = false;
    setIsTracking(false);
    lastSavedTimeRef.current = null;
    onTrackingStop && onTrackingStop();
  };

  // Funkcija za renderovanje rute na mapi kada želimo
  const showRouteOnMap = () => {
    setRouteToRender([...routeRef.current]);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      isTrackingRef.current = false;
    };
  }, []);

  return (
    <div className="route-tracker">
      {/* Control Panel */}
      <div
        className="tracking-controls"
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
        {/*{routeId && (
          <p>
            <strong>Route ID:</strong> {routeId}
          </p>
        )}
          

        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
        )}

        <div style={{ marginBottom: "10px" }}>
          <strong>Status:</strong> {isTracking ? "Tracking Active" : "Tracking Stopped"}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>GPS Updates:</strong> {gpsUpdateCount}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Points Saved to DB:</strong> {pointsSaved}
        </div>
        */}

        {!isTracking ? (
          <button
            onClick={startTracking}
            style={{
              background: "#28a745",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Stop Tracking
          </button>
        )}

        {/* Dugme za prikaz rute na mapi */}
        <button
          onClick={showRouteOnMap}
          style={{
            background: "#007bff",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Show Route on Map
        </button>
      </div>

      {/* Map */}
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
            <Polyline
              path={routeToRender}
              options={{
                strokeColor: "#FF0000",
                strokeWeight: 4,
                strokeOpacity: 0.8,
              }}
            />
          )}

          {routeToRender.length > 0 && (
            <>
              <Marker
                position={routeToRender[0]}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill="#00FF00" stroke="#FFFFFF" stroke-width="2"/>
                      </svg>
                    `),
                  scaledSize: { width: 20, height: 20 },
                }}
                title="Start Position"
              />
              <Marker
                position={routeToRender[routeToRender.length - 1]}
                icon={{
                  url:
                    "data:image/svg+xml;charset=UTF-8," +
                    encodeURIComponent(`
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="2"/>
                      </svg>
                    `),
                  scaledSize: { width: 20, height: 20 },
                }}
                title="Current Position"
              />
            </>
          )}
        </GoogleMap>
    </div>
  );
}
