export async function getCurrentPosition() {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocalización no disponible en este dispositivo");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        reject(new Error("No se pudo obtener la ubicación"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  const res = await fetch(url);
  const data = await res.json();

  return data.display_name || "";
}

export async function searchPlaces(query) {
  if (!query || query.length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=5`;

  const res = await fetch(url);
  const data = await res.json();

  return data.map((item) => ({
    label: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}

export function openInMaps(lat, lon) {
  const url = `https://www.google.com/maps?q=${lat},${lon}`;
  window.open(url, "_blank");
}
