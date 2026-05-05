import { registerPlugin } from "@capacitor/core";

const HajkiTracker = registerPlugin("HajkiTracker");

/**
 * Android foreground servis — šalje tačke na apiBaseUrl/routes/track_point sa Bearer tokenom.
 * @param {{ routeId?: string, apiBaseUrl: string, authToken?: string }} opts
 */
export async function startNativeTracking(opts) {
  await HajkiTracker.startTracking({
    routeId: opts.routeId != null ? String(opts.routeId) : "",
    apiBaseUrl: (opts.apiBaseUrl || "").replace(/\/$/, ""),
    authToken: opts.authToken || "",
  });
}

export async function stopNativeTracking() {
  await HajkiTracker.stopTracking();
}

export async function addNativeLocationListener(callback) {
  return HajkiTracker.addListener("locationUpdate", callback);
}

export async function addNativeRouteIdListener(callback) {
  return HajkiTracker.addListener("routeIdUpdate", callback);
}
