export async function getCurrentPosition() {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocalización no disponible en este dispositivo.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error?.code === error.PERMISSION_DENIED) {
          reject(new Error("Permiso de ubicación denegado."));
          return;
        }

        if (error?.code === error.TIMEOUT) {
          reject(new Error("La ubicación tardó demasiado en responder."));
          return;
        }

        reject(new Error("No se pudo obtener la ubicación actual."));
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
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Coordenadas no válidas para resolver la ubicación.");
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("No se pudo traducir la ubicación a una dirección legible.");
  }

  const data = await res.json();
  return String(data?.display_name || "").trim();
}

export async function searchPlaces(query) {
  const cleanQuery = String(query || "").trim();
  if (cleanQuery.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", cleanQuery);

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("No se pudieron buscar ubicaciones ahora mismo.");
  }

  const data = await res.json();

  if (!Array.isArray(data)) return [];

  return data
    .map((item) => ({
      label: String(item?.display_name || "").trim(),
      lat: Number(item?.lat),
      lon: Number(item?.lon),
    }))
    .filter(
      (item) =>
        item.label &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon)
    );
}

export function openInMaps({ latitude, longitude, query }) {
  const hasCoords =
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));

  let url = "https://www.google.com/maps";

  if (hasCoords) {
    url = `https://www.google.com/maps?q=${encodeURIComponent(
      `${Number(latitude)},${Number(longitude)}`
    )}`;
  } else if (String(query || "").trim()) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      String(query).trim()
    )}`;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
