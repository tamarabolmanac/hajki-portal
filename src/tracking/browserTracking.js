import { authenticatedFetch } from "../utils/api";

let watchId = null;
let routeRef = [];
let lastSavedTime = null;
let isSaving = false;
let currentRouteId = null;

export async function startBrowserTracking(routeId, onPointSaved, onError, onGPSUpdate) {
  routeRef = [];
  lastSavedTime = null;
  isSaving = false;
  currentRouteId = routeId;

  if (!("geolocation" in navigator)) {
    onError && onError("Geolocation is not supported by this browser");
    return;
  }

  console.log('🚀 Starting browser tracking...');
  console.log('📍 Requesting location permission...');

  watchId = navigator.geolocation.watchPosition(
    async pos => {
      console.log('✅ Location permission granted');
      const { latitude, longitude, accuracy } = pos.coords;
      const currentTime = Date.now();
      const newPoint = { lat: latitude, lng: longitude };

      console.log('📍 GPS update:', latitude.toFixed(6), longitude.toFixed(6));
      routeRef.push(newPoint);
      
      // Pozovi callback za svaki GPS update (za real-time mapu)
      onGPSUpdate && onGPSUpdate(newPoint);

      const shouldSave =
        !lastSavedTime || currentTime - lastSavedTime >= 5000;

      if (shouldSave && !isSaving) {
        try {
          isSaving = true;

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
            lastSavedTime = currentTime;
            console.log('✅ Point saved to backend successfully');
            onPointSaved && onPointSaved(newPoint);
            if (response.route_id) {
              console.log('📋 Route ID:', response.route_id);
              currentRouteId = response.route_id;
            }
          } else {
            console.error('❌ Failed to save point:', response);
          }
        } catch (err) {
          onError && onError(err);
        } finally {
          isSaving = false;
        }
      }
    },
    err => {
      onError && onError(err.message);
    },
    { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
  );
}

export function stopBrowserTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

export function getBrowserRoute() {
  return [...routeRef];
}
