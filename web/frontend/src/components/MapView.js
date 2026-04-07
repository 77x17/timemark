import { MapContainer, TileLayer, Marker, Tooltip, Popup, Polyline } from "react-leaflet";

import MapController from "./MapController";

import { defaultIcon, redIcon } from "../utils/leafletIcons";

function MapView({ points, mapRef, selectedId, setSelectedId, routes }) {
  if (points.length <= 0 || points[0].lat == null || points[0].lng == null) return null;

  const colors = ["red", "blue", "green", "orange", "purple", "black"];

  function getColor(index) {
    return colors[index % colors.length];
  }

  const selectedDevice = points.find(point => point.id === selectedId)?.deviceId ?? null;

  return (
    <MapContainer
      center = {[ points[0].lat, points[0].lng]}
      zoom = {13}
      className = "map"
    >
      <MapController 
        mapRef = { mapRef }
        points = { points }
        routes = { routes }
        selectedId = { selectedId }
      />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Marker */}
      { points.map((point) => ( point.lat != null && point.lng != null &&
        <Marker
          key = { point.id }
          position = {[ point.lat, point.lng ]}
          icon = { point.id === selectedId ? redIcon : defaultIcon }
          ref = { (ref) => {
            if (ref && point.id === selectedId) {
              ref.openPopup();
            }
          }}
          eventHandlers = {{
            click: () => {
              setSelectedId(point.id)
            }
          }}
        >
          { points.length > 1 && 
            <Tooltip
              permanent
              direction="top"
              offset = {[0, -40]}
              className = "marker-label"
            >
              {point.order}
            </Tooltip>
          }
          <Popup
            permanent
            direction="top"
            offset = {[0, -30]}
          >
            <div className = "popup-box">
              { point.imageUrl != null &&
                <img
                  src = { point.imageUrl }
                  alt = "preview"
                  style = {{ width: "100px" }}
                />
              }
              <p><b>Lat : </b>{ point.lat.toFixed(6) }</p>
              <p><b>Lng : </b>{ point.lng.toFixed(6) }</p>
              { point.time != null && 
                <p><b>Time: </b>{ new Date(point.time).toLocaleString('vi-VN') }</p>
              }
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Line */}
      {/* { routes && routes.length > 0 && (
        <Polyline positions = {route} color = "blue" weight = "8"/>
      )} */}
      { routes && Object.keys(routes).map(( deviceId, index ) => {
        const route = routes[deviceId];

        if (!route || route.length === 0) return null;

        return (
          <Polyline
            key = { deviceId }
            positions = { route }
            pathOptions={{
              color  : getColor(index),
              opacity: selectedDevice === deviceId ? 0.9 : 0.7,
              weight : selectedDevice === deviceId ? 8 : 5
            }}
          />
        );
      })}
    </MapContainer>
  );
}

export default MapView;