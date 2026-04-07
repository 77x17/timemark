import { useMap } from "react-leaflet";
import { useEffect } from "react";

function MapController({ mapRef, points, routes, selectedId }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (!map) return;

    // 🎯 nếu click marker → zoom vào device đó
    if (selectedId != null) {
      const selectedPoint = points.find(p => p.id === selectedId);

      if (selectedPoint) {
        const deviceId = selectedPoint.deviceId;
        const route = routes[deviceId];

        if (route && route.length > 0) {
          map.fitBounds(route, { padding: [50, 50] });
          return;
        }

        // fallback zoom vào 1 điểm
        map.setView([selectedPoint.lat, selectedPoint.lng], 16);
        return;
      }
    }

    // 🧠 default behavior
    const routePoints = Object.values(routes || {}).flat();

    if (routePoints.length > 0) {
      map.fitBounds(routePoints, { padding: [50, 50] });
    } 
    else if (points.length > 0) {
      map.fitBounds(points.map(p => [p.lat, p.lng]), { padding: [50, 50] });
    }

  }, [routes, points, selectedId, map]);

  return null;
}

export default MapController;