export async function uploadImages(items) {
  const formData = new FormData();

  items.forEach((item) => {
    formData.append("images", item.file);
  });

  const res = await fetch("http://localhost:8080/upload", {
    method: "POST",
    body: formData,
  });

  const result = await res.json();
  return result;
}