const PROD_API = "https://app-backend-jd8f.onrender.com";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? PROD_API : "http://127.0.0.1:8000");

export default API_BASE;

export const EVENTS_URL = `${API_BASE}/events`;

export function buildApiUrl(path = "") {
  if (!path) return API_BASE;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
