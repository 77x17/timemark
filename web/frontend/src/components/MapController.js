import { useMap } from "react-leaflet";

import { useEffect } from "react";

function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  return null;
}

export default MapController;