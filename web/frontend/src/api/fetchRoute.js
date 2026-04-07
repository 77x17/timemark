export async function fetchRoute(positions) {
  const coords = positions.map(p => `${p[1]},${p[0]}`).join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
}