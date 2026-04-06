import "./App.css";

import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from "react-leaflet";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const defaultIcon = new L.Icon({
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  return null;
}

function App() {
  // { file, lat, lng, time }
  const [ items, setItems ] = useState([]);
  const mapRef = useRef();
  const [ selectedIndex, setSelectedIndex ] = useState(null);

  const handleUpload = () => {
    if (items.length === 0) {
      alert("Chưa chọn ảnh!");
      return;
    }

    const newItems = items.map((item, index) => ({
      ...item,
      lat: 10.7769 + Math.random() * 0.01,
      lng: 106.7009 + Math.random() * 0.01,
      time: new Date().toISOString(),
      order: index + 1,
    }));

    setItems(newItems);
  };

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);

    const newItems = files.map((file) => ({
      file,
      lat: null,
      lng: null,
      time: null,
      order: null,
    }));

    setItems((prevItems) => [...prevItems, ...newItems]);
  }

  const handleDelete = (deleteIndex) => {
    setItems((prev) => prev.filter((_, i) => i !== deleteIndex));

    setSelectedIndex((prev) => {
      if (prev === deleteIndex) return null;
      if (prev > deleteIndex) return prev - 1;
      return prev;
    });
  };

  return (
    <div className = "container">
      <div className = "upload-box">
        <label className="file-input-label">
          Select Images
          <input
            type="file"
            multiple
            onChange={handleAddImages}
            hidden
          />
        </label>

        <button onClick = {handleUpload}>Upload</button>
      </div>
      
      <div className = "preview-list">
        { items.map((item, index) => (
          <div key = {index} className = "preview-item">
            <img 
              src = {URL.createObjectURL(item.file)}
              alt = "preview"
              className = "preview-img"
              onClick = {() => {
                console.log("mapRef:", mapRef.current.getCenter());
                console.log("item: ", item);
                if (item.lat != null && mapRef.current) {
                  const center = mapRef.current.getCenter();
                  const isSame = 
                    Math.abs(center.lat - item.lat) < 0.0001 && 
                    Math.abs(center.lng - item.lng) < 0.0001 && 
                    selectedIndex != null;

                  if (isSame) return;

                  mapRef.current.flyTo([item.lat, item.lng], 16, { duration: 1 });
                  setSelectedIndex(index);
                }
              }}
            />

            <button
              className = "delete-btn"
              onClick = {(e) => {
                e.stopPropagation();
                handleDelete(index);
              }}
            >✕</button>
          </div>
        ))}
      </div>

      { items.length > 0 && items[0].lat && (
        <MapContainer
          center={[items[0].lat, items[0].lng]}
          zoom={13}
          className = "map"
        >
          <MapController mapRef = {mapRef}/>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          { items.map((item, index) => ( item.lat != null && 
            <Marker
              key = {index}
              position={[item.lat, item.lng]}
              icon = {index === selectedIndex ? redIcon : defaultIcon }
              ref = {(ref) => {
                if (ref && index === selectedIndex) {
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
                {item.order}
              </Tooltip>
              <Popup>
                <div className = "popup-box">
                  <img
                    src={URL.createObjectURL(item.file)}
                    alt="preview"
                    style={{ width: "100px" }}
                  />
                  <p><b>Lat : </b>{ item.lat.toFixed(6) }</p>
                  <p><b>Lng : </b>{ item.lng.toFixed(6) }</p>
                  <p><b>Time: </b>{ new Date(item.time).toLocaleTimeString() }</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}

export default App;