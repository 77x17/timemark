function parseQRData(raw) {
  try {
    const url = new URL(raw);

    const pointStr = url.searchParams.get("points");
    if (!pointStr) return null;

    const [ lat, lng, time ] = pointStr.split(",");

    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      time: time
    };

  } catch {
    return null;
  }
}

module.exports = { parseQRData };