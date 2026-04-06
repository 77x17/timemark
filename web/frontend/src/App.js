import "./App.css";

import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from "react-leaflet";

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
  const [ selectedId, setSelectedId ] = useState(null);

  const createItem = (file) => ({
    id: crypto.randomUUID(),
    file,
    lat: null,
    lng: null,
    time: null,
    order: null,
  });

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);

    const newItems = files.map((file) => createItem(file));

    setItems((prevItems) => [...prevItems, ...newItems]);
  }

  const handleDelete = (id) => {
    setItems((prev) => {
      const newItems = prev.filter(item => item.id !== id);

      const newPositions = newItems
        .filter(item => item.lat != null && item.lng != null)
        .map(item => [item.lat, item.lng]);

      if (newPositions.length >= 2) {
        fetchRoute(newPositions).then(setRoute);
      } else {
        setRoute([]);
      }

      return newItems;
    });

    setSelectedId((prev) => (prev === id ? null : prev));
  };

  const handleUpload = async () => {
    if (items.length === 0) {
      alert("Chưa chọn ảnh!");
      return;
    }

    try {
      const formData = new FormData();

      items.forEach((item) => {
        formData.append("images", item.file);
      });

      const res = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!result.success) {
        alert("Upload thất bại!");
        return;
      }

      const newItems = items.map((item, index) => ({
        ...item,
        lat: result.data[index].lat,
        lng: result.data[index].lng,
        time: result.data[index].time,
        order: result.data[index].order,
      }));

      newItems.sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });

      setItems(newItems);

      const newPositions = newItems
      .filter(item => item.lat != null && item.lng != null)
      .map(item => [item.lat, item.lng]);

      if (newPositions.length >= 2) {
        const route = await fetchRoute(newPositions);
        setRoute(route);
      } else {
        setRoute([]);
      }
    }
    catch (err) {
      console.log(err);
      alert("Lỗi khi upload");
    }
  };

  const positions = items
    .filter(item => item.lat != null && item.lng != null)
    .map(item => [item.lat, item.lng]);

  const [route, setRoute] = useState([]);

  async function fetchRoute(positions) {
    const coords = positions.map(p => `${p[1]},${p[0]}`).join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }

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
        { items.map((item) => (
          <div key = {item.id} className = "preview-item">
            <img 
              src = {URL.createObjectURL(item.file)}
              alt = "preview"
              className = "preview-img"
              onClick = {() => {
                if (item.lat != null && mapRef.current) {
                  const center = mapRef.current.getCenter();
                  const isSame = 
                    Math.abs(center.lat - item.lat) < 0.0001 && 
                    Math.abs(center.lng - item.lng) < 0.0001 && 
                    selectedId === item.id;

                  if (isSame) return;

                  mapRef.current.flyTo([item.lat, item.lng], 16, { duration: 1 });
                  setSelectedId(item.id);
                }
              }}
            />

            <button
              className = "delete-btn"
              onClick = {(e) => {
                e.stopPropagation();
                handleDelete(item.id);
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

          {/* Marker */}
          { items.map((item) => ( item.lat != null && 
            <Marker
              key = {item.id}
              position={[item.lat, item.lng]}
              icon = {item.id === selectedId ? redIcon : defaultIcon }
              ref = {(ref) => {
                if (ref && item.id === selectedId) {
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
                  <p><b>Time: </b>{ new Date(item.time).toLocaleString('vi-VN') }</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Line */}
          { route.length > 0 && (
            <Polyline positions = {route} color = "blue" weight = "10"/>
          )}
        </MapContainer>
      )}
    </div>
  );
}

export default App;