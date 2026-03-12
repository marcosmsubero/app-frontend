const FALLBACK_API_BASE = "https://app-backend-jd8f.onrender.com";

export const API_BASE = (import.meta.env.VITE_API_BASE || FALLBACK_API_BASE).replace(/\/+$/, "");

export function buildApiUrl(path = "") {
  if (!path) return API_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export default API_BASE;
