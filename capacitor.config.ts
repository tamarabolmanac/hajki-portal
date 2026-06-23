import path from 'path';
import { config as loadDotenv } from 'dotenv';
import type { CapacitorConfig } from '@capacitor/cli';

// cap sync ne učitava .env sam od sebe — potrebno za CAPACITOR_SERVER_URL iz .env
loadDotenv({ path: path.join(process.cwd(), '.env') });

/**
 * CAPACITOR_SERVER_URL u .env → WebView učitava produkcijski front (npr. https://hajki.com).
 * Origin u zahtevima ka api.hajki.com onda odgovara CORS-u (kao „juče“).
 * Za potpuno lokalni bundle u APK: obriši ili isprazni CAPACITOR_SERVER_URL u .env pa cap sync.
 */
const liveUrl = (process.env.CAPACITOR_SERVER_URL || '').trim();

/**
 * Bez ovoga Capacitor na Androidu otvara accounts.google.com u spoljašnjem pregledaču;
 * Google onda vrati na https://localhost/login u tom pregledaču → "Adresa null je nedostupna".
 * allowNavigation drži ceo OAuth u WebView-u.
 */
const server: NonNullable<CapacitorConfig['server']> = {
  allowNavigation: [
    'accounts.google.com',
    '*.google.com',
    '*.googleusercontent.com',
    'oauth2.googleapis.com',
  ],
  ...(liveUrl
    ? {
        url: liveUrl,
        // Allow cleartext only for local http dev (e.g. http://localhost:3001 over adb reverse);
        // stays strict for https production URLs.
        cleartext: liveUrl.startsWith('http://'),
      }
    : {}),
};

const config: CapacitorConfig = {
  appId: 'com.hajki',
  appName: 'hajki-portal',
  webDir: 'build',
  server,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0B0F0D',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
  },
};

export default config;
