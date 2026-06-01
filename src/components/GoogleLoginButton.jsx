import React, { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { GoogleLogin } from "@react-oauth/google";
import { config } from "../config";
import { explainUnreachableApiError } from "../utils/fetchErrors";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const STORAGE_STATE = "google_oauth_state";
const STORAGE_NONCE = "google_oauth_nonce";

function getClientId() {
  return (
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "773319521935-g98hjlfcg47khlnc4ajjp9itgb6rp0e4.apps.googleusercontent.com"
  );
}

/** Pojedini Android WebView-i vrate origin kao https://null → Google redirect na nedostupan host. */
function isBrokenOrigin(origin) {
  const o = (origin || "").trim().toLowerCase();
  if (!o || o === "null") return true;
  return /^https?:\/\/null(?::|\/|$)/i.test(origin.trim());
}

/**
 * Mora biti BYTE-PO-BYTE isti kao jedan od "Authorized redirect URIs" za OAuth 2.0 Client tipa **Web application**.
 * U Console dodaj i "Authorized JavaScript origins" (origin bez /login).
 */
function getOAuthRedirectUri() {
  if (config.googleOAuthRedirectUri) {
    return config.googleOAuthRedirectUri.replace(/\/$/, "");
  }
  if (typeof window === "undefined") return "";
  const plat = Capacitor.getPlatform();

  // Na Androidu i iOS koristimo App Links — Android presreće https://hajki.com/login i vraća u app
  if (plat === "android" || plat === "ios") {
    return "https://hajki.com/login";
  }

  const rawOrigin = (window.location.origin || "").trim();
  if (isBrokenOrigin(rawOrigin)) {
    try {
      const { protocol, hostname, port } = window.location;
      if (hostname && hostname !== "null") {
        const p = port ? `:${port}` : "";
        return `${protocol}//${hostname}${p}/login`.replace(/([^:]\/)\/+/g, "$1");
      }
    } catch {
      /* ignore */
    }
    return "https://localhost/login";
  }
  return `${rawOrigin.replace(/\/$/, "")}/login`;
}

function randomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function parseHashParams() {
  const h = window.location.hash.replace(/^#/, "");
  if (!h) return null;
  return new URLSearchParams(h);
}

function decodeJwtPayload(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function GoogleSignInButton({ onLoggedIn }) {
  const [loading, setLoading] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(250);
  /** GIS iframe is often blank in Android WebView; redirect flow returns id_token in hash (same backend). */
  const [useRedirectFlow, setUseRedirectFlow] = useState(false);
  const handledRedirect = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const sync = () => {
      const plat = Capacitor.getPlatform();
      const native = plat === "android" || plat === "ios";
      setUseRedirectFlow(native || mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const clearOAuthHash = useCallback(() => {
    try {
      const { pathname, search, origin } = window.location;
      const path = pathname || "/login";
      const q = search || "";
      if (origin && !isBrokenOrigin(origin)) {
        window.history.replaceState(null, "", `${origin}${path}${q}`);
      } else {
        window.history.replaceState(null, "", `${path}${q}`);
      }
    } catch {
      window.history.replaceState(null, "", "/login");
    }
  }, []);

  const exchangeIdToken = useCallback(
    async (idToken) => {
      if (!idToken) return;
      setLoading(true);
      try {
        const res = await fetch(`${config.apiUrl}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ id_token: idToken }),
        });

        let payload = null;
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          payload = await res.json();
        } else {
          payload = { message: await res.text() };
        }

        if (!res.ok) {
          throw new Error(payload?.message || "Google login failed");
        }

        if (payload.token) {
          localStorage.setItem("authToken", payload.token);
        }
        if (payload.user_id) {
          localStorage.setItem("userID", payload.user_id);
        }

        onLoggedIn?.(payload?.user || {});

        if (!onLoggedIn) {
          if (window.navigate) {
            window.navigate("/");
          } else {
            window.location.assign("/");
          }
        }
      } catch (error) {
        console.error("Google login error:", error);
        alert(
          explainUnreachableApiError(error, config.apiUrl) ||
            error?.message ||
            "Failed to sign in with Google"
        );
      } finally {
        setLoading(false);
      }
    },
    [onLoggedIn]
  );

  // Native App Link listener — hvata https://hajki.com/login#id_token=... redirect
  useEffect(() => {
    const plat = Capacitor.getPlatform();
    if (plat !== "android" && plat !== "ios") return;

    let listener;
    App.addListener("appUrlOpen", async ({ url }) => {
      if (handledRedirect.current) return;
      if (!url || !url.includes("/login")) return;

      // Zatvori Chrome Custom Tab
      try { await Browser.close(); } catch {}

      // Parsiraj hash parametre iz URL-a
      const hashIndex = url.indexOf("#");
      if (hashIndex === -1) return;
      const params = new URLSearchParams(url.slice(hashIndex + 1));
      const idToken = params.get("id_token");
      const error = params.get("error");

      if (error) {
        handledRedirect.current = true;
        alert(decodeURIComponent(params.get("error_description") || error).replace(/\+/g, " "));
        return;
      }
      if (!idToken) return;

      const expectedState = sessionStorage.getItem(STORAGE_STATE);
      const returnedState = params.get("state");
      if (!expectedState || expectedState !== returnedState) {
        handledRedirect.current = true;
        alert("Greška bezbednosti pri Google prijavi. Pokušajte ponovo.");
        return;
      }

      handledRedirect.current = true;
      sessionStorage.removeItem(STORAGE_STATE);
      sessionStorage.removeItem(STORAGE_NONCE);
      void exchangeIdToken(idToken);
    }).then(l => { listener = l; });

    return () => { listener?.remove(); };
  }, [exchangeIdToken]);

  // Web redirect handler (hash u URL-u)
  useEffect(() => {
    if (handledRedirect.current) return;
    const params = parseHashParams();
    if (!params) return;

    const idToken = params.get("id_token");
    const error = params.get("error");
    const errorDesc = params.get("error_description");

    if (error) {
      handledRedirect.current = true;
      clearOAuthHash();
      alert(decodeURIComponent(errorDesc || error || "").replace(/\+/g, " ") || "Google prijava otkazana.");
      return;
    }

    if (!idToken) return;

    const expectedState = sessionStorage.getItem(STORAGE_STATE);
    const returnedState = params.get("state");
    if (!expectedState || expectedState !== returnedState) {
      handledRedirect.current = true;
      clearOAuthHash();
      alert("Greška bezbednosti pri Google prijavi. Pokušajte ponovo.");
      return;
    }

    const expectedNonce = sessionStorage.getItem(STORAGE_NONCE);
    const jwtPayload = decodeJwtPayload(idToken);
    if (expectedNonce && jwtPayload?.nonce && jwtPayload.nonce !== expectedNonce) {
      handledRedirect.current = true;
      sessionStorage.removeItem(STORAGE_STATE);
      sessionStorage.removeItem(STORAGE_NONCE);
      clearOAuthHash();
      alert("Greška bezbednosti pri Google prijavi. Pokušajte ponovo.");
      return;
    }

    handledRedirect.current = true;
    sessionStorage.removeItem(STORAGE_STATE);
    sessionStorage.removeItem(STORAGE_NONCE);
    clearOAuthHash();
    void exchangeIdToken(idToken);
  }, [clearOAuthHash, exchangeIdToken]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setButtonWidth(Math.min(300, Math.max(200, w - 48)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const startRedirectLogin = async () => {
    const clientId = getClientId();
    const state = randomId();
    const nonce = randomId();
    sessionStorage.setItem(STORAGE_STATE, state);
    sessionStorage.setItem(STORAGE_NONCE, nonce);
    const redirectUri = getOAuthRedirectUri();
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "id_token",
      scope: "openid email profile",
      state,
      nonce,
      prompt: "select_account",
    });
    const url = `${GOOGLE_AUTH}?${q.toString()}`;
    const plat = Capacitor.getPlatform();
    if (plat === "android" || plat === "ios") {
      // Chrome Custom Tabs — Google prihvata, za razliku od WebView-a
      await Browser.open({ url });
    } else {
      window.location.href = url;
    }
  };

  const handleIframeSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      console.error("Missing ID token from Google:", credentialResponse);
      alert("Google login failed: missing ID token.");
      return;
    }
    await exchangeIdToken(idToken);
  };

  const handleIframeError = () => {
    console.error("Google login failed");
    alert("Failed to sign in with Google");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "300px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {useRedirectFlow ? (
        <button
          type="button"
          className="google-login-fallback-btn"
          onClick={startRedirectLogin}
          disabled={loading}
          aria-label="Prijavi se putem Google-a"
        >
          <span className="google-login-fallback-btn__icon" aria-hidden>
            <svg viewBox="0 0 48 48" width="20" height="20">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.43 37.96 46.98 31.79 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
          </span>
          <span className="google-login-fallback-btn__text">Prijavi se putem Google-a</span>
        </button>
      ) : (
        <GoogleLogin
          onSuccess={handleIframeSuccess}
          onError={handleIframeError}
          useOneTap={false}
          theme="outline"
          size="large"
          width={String(buttonWidth)}
          text="signin_with"
          containerProps={{
            style: {
              width: "100%",
              maxWidth: `${buttonWidth}px`,
              margin: "0 auto",
              overflow: "visible",
            },
          }}
        />
      )}

      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.8)",
            borderRadius: 999,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.9)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
            }}
          >
            <div className="loading-spinner-modern" />
            <span
              style={{
                fontSize: 13,
                color: "#e5e7eb",
                fontWeight: 600,
              }}
            >
              Prijavljivanje Google nalogom…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleLoginButton({ onLoggedIn }) {
  return <GoogleSignInButton onLoggedIn={onLoggedIn} />;
}
