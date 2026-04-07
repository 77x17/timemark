function PreviewList({ items, selectedId, setSelectedId, mapRef, handleDelete }) {
  return (
    <div className = "preview-list">
      { items.map((item) => (
        <div key = {item.id} className = "preview-item">
          <img 
            src = { URL.createObjectURL(item.file) }
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
  );
}

export default PreviewList;