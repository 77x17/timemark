import "./App.css";

import { useState, useRef, useEffect } from "react";

import UploadBox   from "./components/UploadBox";
import PreviewList from "./components/PreviewList";
import MapView     from "./components/MapView";

import { fetchRoute }   from "./api/fetchRoute";
import { uploadImages } from "./api/uploadImages";

import { createItem } from "./utils/createItem";

function App() {
  // { id, file, lat, lng, time, order, deviceId }
  const [ items     , setItems      ] = useState([]);
  const [ selectedId, setSelectedId ] = useState(null);
  // const [ route     , setRoute      ] = useState([]);
  const [ routes    , setRoutes     ] = useState({});
  const [ points    , setPoints     ] = useState([]);
  const [ mapUrl    , setMapUrl     ] = useState(null);
  const mapRef = useRef();

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);

    const newItems = files.map((file) => createItem(file));

    setItems((prevItems) => [...prevItems, ...newItems]);
  }

  const generateRoutes = (newItems) => {
    const validItems = newItems.filter(item => item.lat != null && item.lng != null);
    const positionsByDevice = {};
    validItems.forEach(item => {
      const deviceId = item.deviceId;

      if (!positionsByDevice[deviceId]) {
        positionsByDevice[deviceId] = [];
      }

      positionsByDevice[deviceId].push([ item.lat, item.lng ]);
    });

    // map + async để duyệt từng device bất đồng bộ
    const routePromises = Object.keys(positionsByDevice).map(async (deviceId) => {
      const positions = positionsByDevice[deviceId];
      if (positions.length < 2) {
        return { deviceId, route: [] };
      }

      const route = await fetchRoute(positions);
      return { deviceId, route };
    })

    // Chạy song song tất cả request
    // Promise.all trả về mảng nên phải build lại thành object
    Promise.all(routePromises).then(results => {
      const routesObj = {};

      results.forEach(({ deviceId, route }) => {
        routesObj[deviceId] = route;
      })

      setRoutes(routesObj);
    });
  }

  const handleDelete = (id) => {
    setItems((prev) => {
      const newItems = prev.filter(item => item.id !== id);

      generateRoutes(newItems);

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
        .map(point => `${point.lat},${point.lng},${point.time},${point.order},${point.deviceId}`)
        .join(";");
      
      const newMapUrl = `http://localhost:3000/?points=${pointsString}`;
      setMapUrl(newMapUrl);

      const newItems = items.map((item, index) => ({
        ...item,
        lat     : result.data[index].lat,
        lng     : result.data[index].lng,
        time    : result.data[index].time,
        order   : result.data[index].order,
        deviceId: result.data[index].deviceId,
      }));

      newItems.sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });

      newItems.sort((a, b) => {
        const idA = a?.deviceId || "";
        const idB = b?.deviceId || "";
        return idA.localeCompare(idB);
      });

      setItems(newItems);

      generateRoutes(newItems);
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
          const [ lat, lng, time, order, deviceId ] = pair.split(",");
          return { 
            id      : index,
            lat     : parseFloat(lat), 
            lng     : parseFloat(lng),
            time    : time,
            order   : order,
            deviceId: deviceId,
          };
        })
        .filter(p => !isNaN(p.lat) && !isNaN(p.lng));
      
      parsed.sort((a, b) => {
        if (a.order == null) return 1;
        if (b.order == null) return -1;
        return a.order - b.order;
      });

      setPoints(parsed);

      generateRoutes(parsed);
    }

    asyncRun();
  }, []);

  // Nếu trích xuất được points từ url thì vẽ map không
  if (points.length >= 1) {
    return (
      <MapView
        points = { points }
        mapRef = { mapRef }
        routes = { routes }
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
        routes = { routes }
        selectedId = { selectedId }
        setSelectedId = { setSelectedId }
      />
    </div>
  );
}

export default App;