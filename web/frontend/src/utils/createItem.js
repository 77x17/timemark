export function createItem(file) {
  return {
    id: crypto.randomUUID(),
    file,
    lat: null,
    lng: null,
    time: null,
    order: null,
  }
};