import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  position: [number, number] | null;
  setPosition: (pos: [number, number]) => void;
}

function LocationMarker({ position, setPosition }: LocationPickerMapProps) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
    locationfound(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate({ setView: true });
  }, [map]);

  return position === null ? null : <Marker position={position}></Marker>;
}

export function LocationPickerMap({ position, setPosition }: LocationPickerMapProps) {
  return (
    <MapContainer
      center={[-23.5505, -46.6333]}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full rounded-md z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  );
}
