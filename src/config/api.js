const LOCAL_API = "http://127.0.0.1:8000";
const PROD_API = "https://app-backend-jd8f.onrender.com";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? PROD_API : LOCAL_API);

const API_BASE = String(RAW_API_BASE || "").replace(/\/+$/, "");

export default API_BASE;
export { API_BASE };

export const EVENTS_PATH = "/events";
export const EVENTS_URL = `${API_BASE}${EVENTS_PATH}`;

export function buildApiUrl(path = "") {
  if (!path) return API_BASE;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function buildEventStreamUrl(token) {
  if (!token) return null;

  const url = new URL(EVENTS_URL);
  url.searchParams.set("token", token);
  return url.toString();
}
