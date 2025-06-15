export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
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
