const PROD_API = "https://app-backend-jd8f.onrender.com"

export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? PROD_API : "http://127.0.0.1:8000")

export const EVENTS_URL = `${API_BASE}/events`
