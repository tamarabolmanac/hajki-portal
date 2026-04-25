
export const config = {
  /** Na telefonu (Capacitor) mora biti javni URL ili LAN IP računara — ne localhost ni Docker ime (backend). */
  //apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  apiUrl: 'https://api.hajki.com' || 'http://localhost:3000',
  /** Mora tačno da se poklopi sa "Authorized redirect URIs" u Google Cloud (npr. https://localhost/login za Capacitor). */
  googleOAuthRedirectUri: (process.env.REACT_APP_GOOGLE_OAUTH_REDIRECT_URI || '').trim() || null,
  /** Javni URL gde je hostovan frontend (npr. https://hajki.com). Za APK: isto kao CAPACITOR_SERVER_URL pri sync. Rešava https://null/login na nekim Android WebView-ima. */
  appWebOrigin: (process.env.REACT_APP_APP_ORIGIN || '').trim().replace(/\/$/, '') || null,
  defaultLocation: {
    lat: 45.8150,
    lng: 15.9819
  },
  mapCenter: {
    lat: 45.8150,
    lng: 15.9819
  },
  mapZoom: 12,
  mapOptions: {
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false
  },
  googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
};

export default config;
