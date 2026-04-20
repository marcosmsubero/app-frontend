const DEFAULT_LOCAL_API = "http://127.0.0.1:8000";
const DEFAULT_PROD_API = "https://app-backend-jd8f.onrender.com";

function normalizeBaseUrl(rawValue, fallback) {
  const value = String(rawValue || fallback || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    return url.toString().replace(/\/+$/, "");
  } catch {
    return String(fallback || "").trim().replace(/\/+$/, "");
  }
}

const envApiBase = import.meta.env.VITE_API_BASE;
// In dev we default to "" so API calls become relative (same-origin as
// the Vite dev server) — Vite's proxy in vite.config.js forwards them
// to the FastAPI backend on port 8000. This avoids the mixed-content
// block when the frontend is served over HTTPS (required for the mic)
// and the backend is still HTTP. In production we hit the deployed API.
const defaultApiBase = import.meta.env.PROD ? DEFAULT_PROD_API : "";

const API_BASE = normalizeBaseUrl(envApiBase, defaultApiBase);

export default API_BASE;
export { API_BASE };

export const EVENTS_PATH = "/events";

export function buildApiUrl(path = "") {
  if (!path) return API_BASE;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function buildEventStreamUrl(token) {
  if (!token || !API_BASE) return null;

  try {
    const url = new URL(buildApiUrl(EVENTS_PATH));
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return null;
  }
}

