import React, { useMemo, useState } from "react";
import { config } from '../config';
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

function GoogleSignInButton({ onLoggedIn }) {
  const [loading, setLoading] = useState(false);

  const apiUrl = useMemo(
    () => process.env.REACT_APP_API_URL || "http://localhost:3000",
    []
  );

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;

    if (!idToken) {
      console.error("Missing ID token (credential) from Google response:", credentialResponse);
      alert("Google login failed: missing ID token.");
      return;
    }

    console.log("Google ID token:", idToken);

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
        const text = await res.text();
        payload = { message: text };
      }

      if (!res.ok) {
        throw new Error(payload?.message || "Google login failed");
      }

      // Store the token and user data in localStorage
      if (payload.token) {
        localStorage.setItem('authToken', payload.token);
      }
      if (payload.user_id) {
        localStorage.setItem('userID', payload.user_id);
      }

      onLoggedIn?.(payload?.user || {});

      // Use navigate for SPA routing if available, otherwise redirect
      if (window.navigate) {
        window.navigate("/");
      } else {
        window.location.assign("/");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(error?.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    console.error("Google login failed");
    alert("Failed to sign in with Google");
  };

  return (
    <div style={{ width: 300, maxWidth: "100%" }}>
      {/* Google dugme - stabilno, podržava One Tap itd. */}
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap={false}
        // theme/size/shape mogu po želji
        theme="outline"
        size="large"
        width="300"
        text={loading ? "signin_with" : "signin_with"}
      />

      {/* Mala zaštita od duplog klika dok čeka backend */}
      {loading && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#5f6368" }}>
          Signing in…
        </div>
      )}
    </div>
  );
}

export default function GoogleLoginButton({ onLoggedIn }) {
  const clientId =
    process.env.REACT_APP_GOOGLE_CLIENT_ID ||
    "773319521935-g98hjlfcg47khlnc4ajjp9itgb6rp0e4.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleSignInButton onLoggedIn={onLoggedIn} />
    </GoogleOAuthProvider>
  );
}
