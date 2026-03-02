import { registerPlugin } from '@capacitor/core';
const HajkiTracker = registerPlugin('HajkiTracker');

export const startNativeTracking = async () => {
  await HajkiTracker.startTracking();
};

export const stopNativeTracking = async () => {
  await HajkiTracker.stopTracking();
};
