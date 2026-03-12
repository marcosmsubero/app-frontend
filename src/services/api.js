// API base automático: mismo host que el frontend, puerto 8000
// ✅ Esto permite borrar VITE_API_BASE del .env y funciona en casa/trabajo
export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function api(
  path,
  { method = "GET", token = localStorage.getItem("token"), body } = {}
) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se puede conectar con el servidor");
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Token inválido/expirado
  if (res.status === 401) {
    localStorage.removeItem("token");
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    throw new Error(
      data?.detail || data?.message || `Error ${res.status}: ${res.statusText}`
    );
  }

  return data;
}

// ✅ Helpers (opcionales): no rompen nada existente
export const apiJoinMeetup = (meetupId, token) =>
  api(`/meetups/${meetupId}/join`, { method: "POST", token });

export const apiLeaveMeetup = (meetupId, token) =>
  api(`/meetups/${meetupId}/leave`, { method: "POST", token });

export const apiUpcomingMeetups = (limit = 10, token) =>
  api(`/meetups/upcoming?limit=${limit}`, { token });

export const apiGroupMeetups = (groupId, token) =>
  api(`/groups/${groupId}/meetups`, { token });

export const apiMeetupSearch = (filters = {}, token) => {
  const params = new URLSearchParams();

  // El backend espera: q, level, from, to, pace_min, pace_max, only_open, limit, offset
  const map = {
    q: filters.q,
    level: filters.level,
    from: filters.from, // alias "from" en FastAPI
    to: filters.to, // alias "to" en FastAPI
    pace_min: filters.pace_min,
    pace_max: filters.pace_max,
    only_open: filters.only_open,
    limit: filters.limit,
    offset: filters.offset,
  };

  for (const [k, v] of Object.entries(map)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }

  const qs = params.toString();
  return api(`/meetups/search${qs ? `?${qs}` : ""}`, { token });
};

export const apiMeProfile = (token) => api(`/me`, { token });

export const apiUpdateProfile = (payload, token) =>
  api(`/me/profile`, { method: "PUT", token, body: payload });

export const apiUpdatePassword = (payload, token) =>
  api(`/me/password`, { method: "PUT", token, body: payload });

export const apiMyMeetups = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`/me/meetups${qs ? `?${qs}` : ""}`, { token });
};

// ✅ NUEVO: eliminar cuenta
export const apiDeleteMe = (token) =>
  api(`/me`, { method: "DELETE", token });

export const apiNotifications = (tab = "all", token) =>
  api(`/notifications?tab=${encodeURIComponent(tab)}`, { token });

export const apiMarkNotifRead = (id, token) =>
  api(`/notifications/${id}/read`, { method: "POST", token });

export const apiDMThreads = (q = "", token) =>
  api(`/dm/threads${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });

export const apiDMMessages = (threadId, token) =>
  api(`/dm/threads/${threadId}/messages`, { token });

export const apiDMSend = (threadId, text, token) =>
  api(`/dm/threads/${threadId}/messages`, { method: "POST", token, body: { text } });

export const apiVerifyEmailStart = (token) =>
  api(`/me/verify/start`, { method: "POST", token });

export const apiVerifyEmailConfirm = (code, token) =>
  api(`/me/verify/confirm`, { method: "POST", token, body: { code } });

export const apiVerifyLocation = (lat, lng, accuracy_m, token) =>
  api(`/me/location/verify`, { method: "POST", token, body: { lat, lng, accuracy_m } });
