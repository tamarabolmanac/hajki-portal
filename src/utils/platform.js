import { Capacitor } from '@capacitor/core';

/**
 * True in the Capacitor native shell (the Android/iOS app) → use the bottom
 * tab bar instead of the top hamburger navbar. Plain web keeps the navbar.
 *
 * Dev override: `?mobile=1` in the URL or localStorage.forceMobile='1'
 * to preview the mobile chrome in a browser.
 */
export const isMobileApp = () => {
  try {
    if (Capacitor?.isNativePlatform?.()) return true;
  } catch { /* Capacitor not present */ }
  if (typeof window !== 'undefined') {
    if (new URLSearchParams(window.location.search).get('mobile') === '1') return true;
    if (window.localStorage?.getItem('forceMobile') === '1') return true;
  }
  return false;
};
