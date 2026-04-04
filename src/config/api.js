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
const defaultApiBase = import.meta.env.PROD ? DEFAULT_PROD_API : DEFAULT_LOCAL_API;

const API_BASE = normalizeBaseUrl(envApiBase, defaultApiBase);

export default API_BASE;
export { API_BASE };

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);
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
  if (!token || !API_BASE) return null;

  try {
    const url = new URL(buildApiUrl(EVENTS_PATH));
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return null;
  }
}

export function getPublicApiConfigSnapshot() {
  return {
    apiBase: API_BASE,
    isProd: Boolean(import.meta.env.PROD),
    mode: import.meta.env.MODE || "unknown",
    timeoutMs: API_TIMEOUT_MS,
  };
}
