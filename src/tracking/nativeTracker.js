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

/**
 * Pošalji zaostale (offline) tačke sa diska i finalizuj rute koje čekaju.
 * Zove se pri otvaranju app-a i posle stop-a, sa SVEŽIM tokenom (da radi i ako
 * je stari istekao offline). Vraća { uploaded, remaining, finalized }.
 */
export async function syncPendingTracking(opts) {
  return HajkiTracker.syncPending({
    apiBaseUrl: (opts.apiBaseUrl || "").replace(/\/$/, ""),
    authToken: opts.authToken || "",
  });
}

/**
 * Na uređajima sa battery saverom (MIUI/Xiaomi…) pozadinski GPS biva gušen.
 * Ovo otvara sistemski dijalog „radi bez ograničenja u pozadini" (jednom tapom),
 * osim ako je izuzeće već dato. Bezopasno na ne-Android/web.
 */
export async function requestBatteryExemption() {
  try {
    return await HajkiTracker.requestBatteryOptimizationExemption();
  } catch (e) {
    return { granted: false, requested: false, error: String(e) };
  }
}

/**
 * Pročita pending stanje iz lokalne baze (bez slanja na server). Za UI oznaku
 * „ruta čeka sinhronizaciju". Vraća { totalPoints, routeIds: string[], finalizeIds: string[] }.
 * Na webu / ne-native platformi metoda ne postoji → vraća prazno.
 */
export async function getPendingSyncStatus() {
  try {
    const r = await HajkiTracker.getPendingStatus();
    return {
      totalPoints: (r && r.totalPoints) || 0,
      routeIds: r && Array.isArray(r.routeIds) ? r.routeIds.map(String) : [],
      finalizeIds: r && Array.isArray(r.finalizeIds) ? r.finalizeIds.map(String) : [],
    };
  } catch (e) {
    return { totalPoints: 0, routeIds: [], finalizeIds: [] };
  }
}

export async function addNativeLocationListener(callback) {
  return HajkiTracker.addListener("locationUpdate", callback);
}

export async function addNativeRouteIdListener(callback) {
  return HajkiTracker.addListener("routeIdUpdate", callback);
}
