import "./App.css";

import { useState, useRef, useEffect } from "react";

import UploadBox   from "./components/UploadBox";
import PreviewList from "./components/PreviewList";
import MapView     from "./components/MapView";

import { fetchRoute }   from "./api/fetchRoute";
import { uploadImages } from "./api/uploadImages";

import { createItem } from "./utils/createItem";

function App() {
  // { id, file, lat, lng, time, order }
  const [ items     , setItems      ] = useState([]);
  const [ selectedId, setSelectedId ] = useState(null);
  const [ route     , setRoute      ] = useState([]);
  const [ points    , setPoints     ] = useState([]);
  const [ mapUrl    , setMapUrl     ] = useState(null);
  const mapRef = useRef();

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
      const result = await uploadImages(items);
      if (!result.success) {
        alert("Upload thất bại!");
        return;
      }

      const pointsString = result.data
        .map(point => `${point.lat},${point.lng},${point.time},${point.order}`)
        .join(";");
      
      const newMapUrl = `http://localhost:3000/?points=${pointsString}`;
      setMapUrl(newMapUrl);

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

  // Dùng url có ?points=lat,lng,time,order;... để truy cập map
  useEffect( () => {
    const asyncRun = async () => {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("points");
      
      if (!raw) return;

      const parsed = raw
        .split(";")
        .map((pair, index) => {
          const [ lat, lng, time, order ] = pair.split(",");
          return { 
            id   : index,
            lat  : parseFloat(lat), 
            lng  : parseFloat(lng),
            time : time,
            order: order,
          };
        })
        .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
      
      parsed.sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });

      setPoints(parsed);

      const newPositions = parsed.map(point => [ point.lat, point.lng ]);

      if (newPositions.length >= 2) {
        const route = await fetchRoute(newPositions);
        setRoute(route);
      } else {
        setRoute([]);
      }
    }

    asyncRun();
  }, []);

  // Nếu trích xuất được points từ url thì vẽ map không
  if (points.length >= 1) {
    return (
      <MapView
        points = { points }
        mapRef = { mapRef }
        route = { route }
        selectedId = { selectedId }
        setSelectedId = { setSelectedId }
      />
    );
  }

  // Default 
  return (
    <div className = "container">
      <UploadBox
        onAddImages = { handleAddImages }
        onUpload = { handleUpload }
      />
      
      <PreviewList
        items = { items }
        selectedId = { selectedId }
        setSelectedId = { setSelectedId }
        mapRef = { mapRef }
        handleDelete = { handleDelete }
      />

      { mapUrl != null && 
        <label> { mapUrl.toString() } </label>
      }

      <MapView
        points = { items.map(item => ({
          id      : item.id,
          lat     : item.lat,
          lng     : item.lng,
          time    : item.time,
          order   : item.order,
          imageUrl: item.file ? URL.createObjectURL(item.file) : null,
        }))}
        mapRef = { mapRef }
        route = { route }
        selectedId = { selectedId }
        setSelectedId = { setSelectedId }
      />
    </div>
  );
}

export default App;