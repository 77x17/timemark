function UploadBox({ onAddImages, onUpload }) {
  return (
    <div className = "upload-box">
      <label className="file-input-label">
        Select Images
        <input
          type = "file"
          multiple
          onChange = { onAddImages }
          hidden
        />
      </label>

      <button onClick = { onUpload }>Upload</button>
    </div>
  );
}

export default UploadBox;