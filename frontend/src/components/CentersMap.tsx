import { useEffect, useMemo } from "react";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Center, GPSLocation } from "../api";

const BENGALURU: [number, number] = [12.9716, 77.5946];

type Props = { centers: Center[]; userLocation: GPSLocation | null };

function MapViewport({ centers, userLocation }: { centers: Center[]; userLocation: GPSLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
      return;
    }
    if (centers.length > 0) {
      const points = centers.map((center) => [center.latitude as number, center.longitude as number] as [number, number]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds.pad(0.2), { maxZoom: 13 });
      return;
    }
    map.setView(BENGALURU, 11);
  }, [map, centers, userLocation]);
  return null;
}

export default function CentersMap({ centers, userLocation }: Props) {
  const mappedCenters = useMemo(
    () => centers.filter((center) => center.active && center.location_verified && center.latitude !== null && center.longitude !== null),
    [centers]
  );

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-stone-600">
        <span className="font-semibold">Bengaluru blood-centre map</span>
        <span>{mappedCenters.length} verified centre pin(s)</span>
      </div>
      <MapContainer center={BENGALURU} zoom={11} scrollWheelZoom={false} style={{ height: "320px", width: "100%" }}>
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, and others"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <MapViewport centers={mappedCenters} userLocation={userLocation} />
        {mappedCenters.map((center) => (
          <CircleMarker
            key={center.id}
            center={[center.latitude as number, center.longitude as number]}
            radius={8}
            pathOptions={{ color: "#991b1b", fillColor: "#ef4444", fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <strong>{center.name}</strong><br />
              {center.address}, {center.city}<br />
              {center.phone || "Contact centre directly"}<br />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                target="_blank"
                rel="noreferrer"
              >Get directions</a>
            </Popup>
          </CircleMarker>
        ))}
        {userLocation && userLocation.accuracy !== undefined && (
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            radius={userLocation.accuracy}
            pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1 }}
          />
        )}
        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={9}
            pathOptions={{ color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.95, weight: 2 }}
          >
            <Popup>
              Your detected location
              {userLocation.accuracy !== undefined && (
                <>
                  <br />
                  Accuracy: about {Math.round(userLocation.accuracy)} m
                </>
              )}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <p className="px-3 py-2 text-[11px] text-stone-500">
        Only active centres with verified coordinates are pinned. Map tiles © Esri.
      </p>
    </div>
  );
}