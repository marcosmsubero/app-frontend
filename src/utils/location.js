const LOCATION_RULES = [
  {
    canonical: "Andalucía",
    aliases: ["andalucia"],
    provinces: [
      "almeria",
      "cadiz",
      "cordoba",
      "granada",
      "huelva",
      "jaen",
      "malaga",
      "sevilla",
    ],
  },
  {
    canonical: "Aragón",
    aliases: ["aragon"],
    provinces: ["huesca", "teruel", "zaragoza"],
  },
  {
    canonical: "Asturias",
    aliases: ["principado de asturias", "asturias"],
    provinces: ["asturias", "oviedo", "gijon", "aviles"],
  },
  {
    canonical: "Illes Balears",
    aliases: ["illes balears", "islas baleares", "baleares"],
    provinces: ["mallorca", "menorca", "ibiza", "eivissa", "formentera", "palma"],
  },
  {
    canonical: "Canarias",
    aliases: ["canarias", "islas canarias"],
    provinces: [
      "las palmas",
      "gran canaria",
      "tenerife",
      "santa cruz de tenerife",
      "lanzarote",
      "fuerteventura",
      "la palma",
      "la gomera",
      "el hierro",
    ],
  },
  {
    canonical: "Cantabria",
    aliases: ["cantabria"],
    provinces: ["cantabria", "santander"],
  },
  {
    canonical: "Castilla-La Mancha",
    aliases: ["castilla la mancha", "castilla-la mancha"],
    provinces: ["albacete", "ciudad real", "cuenca", "guadalajara", "toledo"],
  },
  {
    canonical: "Castilla y León",
    aliases: ["castilla y leon", "castilla-leon", "castilla leon"],
    provinces: [
      "avila",
      "burgos",
      "leon",
      "palencia",
      "salamanca",
      "segovia",
      "soria",
      "valladolid",
      "zamora",
    ],
  },
  {
    canonical: "Cataluña",
    aliases: ["cataluna", "cataluña", "catalunya"],
    provinces: ["barcelona", "girona", "gerona", "lleida", "lerida", "tarragona"],
  },
  {
    canonical: "Comunidad de Madrid",
    aliases: ["comunidad de madrid", "madrid"],
    provinces: ["madrid", "alcala de henares", "mostoles", "fuenlabrada", "getafe"],
  },
  {
    canonical: "Navarra",
    aliases: ["comunidad foral de navarra", "navarra"],
    provinces: ["navarra", "pamplona", "iruna", "iruña", "tudela"],
  },
  {
    canonical: "Comunitat Valenciana",
    aliases: ["comunitat valenciana", "comunidad valenciana"],
    provinces: [
      "alicante",
      "alacant",
      "valencia",
      "castellon",
      "castellón",
      "elche",
      "alcoi",
      "alcoy",
      "benidorm",
      "torrevieja",
      "gandia",
    ],
  },
  {
    canonical: "Extremadura",
    aliases: ["extremadura"],
    provinces: ["badajoz", "caceres", "cáceres", "merida", "mérida"],
  },
  {
    canonical: "Galicia",
    aliases: ["galicia"],
    provinces: [
      "a coruna",
      "a coruña",
      "coruna",
      "coruña",
      "lugo",
      "ourense",
      "orense",
      "pontevedra",
      "vigo",
      "santiago de compostela",
    ],
  },
  {
    canonical: "La Rioja",
    aliases: ["la rioja", "rioja"],
    provinces: ["la rioja", "logrono", "logroño"],
  },
  {
    canonical: "País Vasco",
    aliases: ["pais vasco", "país vasco", "euskadi"],
    provinces: [
      "alava",
      "álava",
      "araba",
      "bizkaia",
      "vizcaya",
      "gipuzkoa",
      "guipuzcoa",
      "bilbao",
      "donostia",
      "san sebastian",
      "san sebastián",
      "vitoria",
      "vitoria-gasteiz",
    ],
  },
  {
    canonical: "Región de Murcia",
    aliases: ["region de murcia", "región de murcia", "murcia"],
    provinces: ["murcia", "cartagena", "lorca"],
  },
  {
    canonical: "Ceuta",
    aliases: ["ceuta"],
    provinces: ["ceuta"],
  },
  {
    canonical: "Melilla",
    aliases: ["melilla"],
    provinces: ["melilla"],
  },
];

function normalizeLocationToken(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[\s/|,_-]+/g, " ")
    .trim();
}

function hasLocationToken(source = "", token = "") {
  const normalizedSource = normalizeLocationToken(source);
  const normalizedToken = normalizeLocationToken(token);

  if (!normalizedSource || !normalizedToken) return false;

  const escaped = normalizedToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i");

  return pattern.test(normalizedSource);
}

function extractCity(address = {}) {
  if (!address || typeof address !== "object") return "";

  return String(
    address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state ||
      ""
  ).trim();
}

function extractDisplayName(value = "") {
  return String(value || "").trim();
}

function extractCommunityFromAddress(address = {}) {
  if (!address || typeof address !== "object") return "";

  const candidates = [
    address.state,
    address.region,
    address.province,
    address.county,
    address.state_district,
  ];

  for (const candidate of candidates) {
    const community = extractAutonomousCommunity(candidate || "");
    if (community) return community;
  }

  return "";
}

function normalizeCommunityForProfile(community = "", rawLocation = "") {
  if (!community) return "";

  if (community === "Comunitat Valenciana") {
    if (
      hasLocationToken(rawLocation, "alicante") ||
      hasLocationToken(rawLocation, "alacant")
    ) {
      return "Alicante";
    }

    if (hasLocationToken(rawLocation, "valencia")) {
      return "Valencia";
    }

    return "Comunitat Valenciana";
  }

  return community;
}

export function extractAutonomousCommunity(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";

  for (const rule of LOCATION_RULES) {
    for (const alias of rule.aliases) {
      if (hasLocationToken(raw, alias)) {
        return rule.canonical;
      }
    }
  }

  for (const rule of LOCATION_RULES) {
    for (const province of rule.provinces) {
      if (hasLocationToken(raw, province)) {
        return rule.canonical;
      }
    }
  }

  return "";
}

export function formatProfileLocationLabel(location, isVerified = false) {
  if (!isVerified) return "";

  const rawLocation = String(location || "").trim();
  const community = extractAutonomousCommunity(rawLocation);

  return normalizeCommunityForProfile(community, rawLocation);
}

export function buildPlaceSelectionMeta(place = {}) {
  const latitude = Number(place?.latitude);
  const longitude = Number(place?.longitude);
  const label = String(place?.label || "").trim();
  const fullLabel = String(place?.fullLabel || label).trim();
  const community = String(
    place?.community ||
      extractAutonomousCommunity(fullLabel) ||
      extractAutonomousCommunity(label) ||
      ""
  ).trim();

  return {
    label,
    fullLabel,
    community: normalizeCommunityForProfile(community, fullLabel || label),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    source: String(place?.source || "search").trim() || "search",
  };
}

export function buildStoredEventLocationMeta(meetup = {}) {
  const label = String(meetup?.meeting_point || meetup?.title || "").trim();
  const fullLabel = String(
    meetup?.location_full_label || meetup?.meeting_point || meetup?.title || ""
  ).trim();
  const latitude = Number(meetup?.latitude);
  const longitude = Number(meetup?.longitude);
  const rawSource = String(meetup?.location_source || "").trim();

  const source = rawSource || (Number.isFinite(latitude) && Number.isFinite(longitude) ? "existing" : "manual");
  const community = normalizeCommunityForProfile(
    extractAutonomousCommunity(fullLabel || label),
    fullLabel || label
  );

  return {
    label,
    fullLabel,
    community,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    source,
  };
}

export function buildManualEventLocationMeta(value = "") {
  const label = String(value || "").trim();
  const community = normalizeCommunityForProfile(
    extractAutonomousCommunity(label),
    label
  );

  return {
    label,
    fullLabel: label,
    community,
    latitude: null,
    longitude: null,
    source: "manual",
  };
}

export function buildEventLocationPayload({ meetingPoint, selectedPlaceMeta }) {
  const cleanMeetingPoint = String(meetingPoint || "").trim();

  if (!cleanMeetingPoint) {
    return {
      meeting_point: "",
      latitude: null,
      longitude: null,
      location_source: null,
    };
  }

  if (selectedPlaceMeta?.label && selectedPlaceMeta.label === cleanMeetingPoint) {
    return {
      meeting_point: cleanMeetingPoint,
      latitude:
        selectedPlaceMeta.latitude === null || selectedPlaceMeta.latitude === undefined
          ? null
          : Number(selectedPlaceMeta.latitude),
      longitude:
        selectedPlaceMeta.longitude === null || selectedPlaceMeta.longitude === undefined
          ? null
          : Number(selectedPlaceMeta.longitude),
      location_source: selectedPlaceMeta.source || "search",
    };
  }

  return {
    meeting_point: cleanMeetingPoint,
    latitude: null,
    longitude: null,
    location_source: "manual",
  };
}

export async function getCurrentPosition() {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocalización no disponible en este dispositivo.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
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

export async function reverseGeocode(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Coordenadas inválidas.");
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(
      lon
    )}&format=json&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("No se pudo traducir la ubicación.");
  }

  const data = await res.json();

  return (
    extractCity(data?.address) ||
    String(data?.name || "").trim() ||
    String(data?.display_name || "")
      .split(",")[0]
      .trim()
  );
}

export async function searchPlaces(query) {
  const clean = String(query || "").trim();
  if (clean.length < 3) return [];

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      clean
    )}&format=json&limit=5&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error("No se pudo buscar la ubicación.");
  }

  const data = await res.json();

  return (Array.isArray(data) ? data : [])
    .map((item) => {
      const label =
        extractCity(item?.address) ||
        String(item?.display_name || "")
          .split(",")[0]
          .trim();

      const fullLabel = extractDisplayName(item?.display_name || "");
      const community = normalizeCommunityForProfile(
        extractCommunityFromAddress(item?.address) ||
          extractAutonomousCommunity(fullLabel) ||
          extractAutonomousCommunity(label),
        fullLabel || label
      );

      return {
        label,
        fullLabel,
        community,
        latitude: Number(item?.lat),
        longitude: Number(item?.lon),
        source: "search",
      };
    })
    .filter(
      (item) =>
        item.label &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    );
}

export function openInMaps(latitude, longitude, label = "") {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

  const q = label ? `${lat},${lon} (${label})` : `${lat},${lon}`;

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
