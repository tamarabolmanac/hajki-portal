import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 45.8150,
  lng: 15.9819
};

const SelectableMap = ({ selectedLocation, setSelectedLocation }) => {
  const mapRef = React.useRef();
  
  const onLoad = React.useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    mapRef.current = undefined;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={(event) => {
          const newLocation = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          setSelectedLocation(newLocation);
        }}
      >
        <Marker position={selectedLocation} />
      </GoogleMap>
    </div>
  );
};

export default SelectableMap;
