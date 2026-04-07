import { MapContainer, TileLayer, Marker, Tooltip, Popup, Polyline } from "react-leaflet";

import MapController from "./MapController";

import { defaultIcon, redIcon } from "../utils/leafletIcons";

function MapView({ points, mapRef, selectedId, route }) {
  if (points.length <= 0 || points[0].lat === null || points[0].lng === null) return;

  return (
    <MapContainer
      center = {[ points[0].lat, points[0].lng]}
      zoom = {13}
      className = "map"
    >
      <MapController mapRef = { mapRef }/>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Marker */}
      { points.map((point) => ( point.lat !== null && point.lng !== null &&
        <Marker
          // key = { point.id }
          position = {[ point.lat, point.lng ]}
          icon = { point.id === selectedId ? redIcon : defaultIcon }
          ref = { (ref) => {
            if (ref && point.id === selectedId) {
              ref.openPopup();
            }
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset = {[0, -40]}
            className = "marker-label"
          >
            {point.order}
          </Tooltip>
          <Popup>
            <div className = "popup-box">
              { point.imageUrl !== null &&
                <img
                  src = { point.imageUrl }
                  alt = "preview"
                  style = {{ width: "100px" }}
                />
              }
              <p><b>Lat : </b>{ point.lat.toFixed(6) }</p>
              <p><b>Lng : </b>{ point.lng.toFixed(6) }</p>
              <p><b>Time: </b>{ new Date(point.time).toLocaleString('vi-VN') }</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Line */}
      { route.length > 0 && (
        <Polyline positions = {route} color = "blue" weight = "10"/>
      )}
    </MapContainer>
  );
}

export default MapView;