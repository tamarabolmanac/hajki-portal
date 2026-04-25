import { Capacitor } from "@capacitor/core";

const USER_NETWORK_MSG =
  "Trenutno nije moguće povezati se sa serverom. Proverite internet vezu i pokušajte ponovo.";

function isNetworkFetchError(error) {
  if (!error) return false;
  const msg = String(error.message || error);
  if (error.name === "TypeError" && /fetch|network|load failed|aborted/i.test(msg)) return true;
  return (
    msg === "Failed to fetch" ||
    msg === "Load failed" ||
    /NetworkError|network error/i.test(msg)
  );
}

/** True when API base URL cannot be resolved from a phone (Docker / loopback). */
function apiBaseLikelyUnreachableFromDevice(apiUrl) {
  try {
    const u = new URL(apiUrl);
    const h = (u.hostname || "").toLowerCase();
    if (!h) return true;
    if (h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0") return true;
    if (h === "backend") return true;
    return false;
  } catch {
    return false;
  }
}

function logDevNetworkHint(apiUrl) {
  if (typeof window === "undefined") return;
  const isNative = Capacitor.isNativePlatform();
  if (!isNative) {
    console.warn("[Hajki API] Nema veze sa serverom. Proveri da li API radi i CORS. apiUrl:", apiUrl);
    return;
  }
  if (apiBaseLikelyUnreachableFromDevice(apiUrl)) {
    console.warn(
      "[Hajki API] Mobilni build ne vidi ovaj apiUrl:",
      apiUrl,
      "\n→ U .env postavi REACT_APP_API_URL na IP računara u Wi‑Fi (npr. http://192.168.1.x:3000), " +
        "Rails na 0.0.0.0, pa rebuild APK. Alternativa: adb reverse tcp:3000 tcp:3000 pa http://127.0.0.1:3000"
    );
  } else {
    console.warn("[Hajki API] Mrežna greška (apiUrl izgleda OK za uređaj):", apiUrl);
  }
}

/**
 * Za mrežne greške fetch-a vraća kratku poruku za korisnika; detalji samo u konzoli.
 * Inače null — koristi error.message.
 */
export function explainUnreachableApiError(error, apiUrl) {
  if (!isNetworkFetchError(error)) return null;
  if (typeof window === "undefined") return null;

  logDevNetworkHint(apiUrl);
  return USER_NETWORK_MSG;
}
