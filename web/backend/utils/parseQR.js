function parseQRData(raw) {
  try {
    const obj = JSON.parse(raw);

    return {
      lat: obj.lat,
      lng: obj.lng,
      time: obj.time
    };
  } catch {
    return null;
  }
}

module.exports = { parseQRData };