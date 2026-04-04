import API_BASE, {
  API_TIMEOUT_MS,
  buildApiUrl,
  getPublicApiConfigSnapshot,
} from "../config/api.js";
import { supabase } from "../lib/supabase.js";
import { normalizeUserContract } from "../lib/userContract.js";

export { API_BASE };

async function getAccessToken() {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function buildTransportErrorMessage(error) {
  if (isAbortError(error)) {
    return "La API tardó demasiado en responder.";
  }

  const snapshot = getPublicApiConfigSnapshot();
  const apiHost = snapshot.apiBase || "API no configurada";

  return `No se puede conectar con el servidor. Revisa Render/CORS/VITE_API_BASE. API actual: ${apiHost}`;
}

function extractApiErrorMessage(res, data) {
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data?.detail) {
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => item?.msg || item?.message || JSON.stringify(item))
        .filter(Boolean)
        .join(" · ");
    }
  }

  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  return `Error ${res.status}: ${res.statusText}`;
}

async function normalizeApiResponse(path, data) {
  if (!data) return data;

  if (
    path === "/me" ||
    path === "/auth/me" ||
    path === "/me/profile" ||
    path === "/me/avatar"
  ) {
    return normalizeUserContract(data);
  }

  return data;
}

export async function api(path, { method = "GET", token, body, signal } = {}) {
  if (!API_BASE) {
    throw new Error("Falta VITE_API_BASE para conectar frontend y backend.");
  }

  const resolvedToken = token ?? (await getAccessToken());

  const headers = {
    Accept: "application/json",
    "Cache-Control": "no-store",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;

  const controller = signal ? null : new AbortController();
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    : null;

  let res;

  try {
    res = await fetch(buildApiUrl(path), {
      method,
      headers,
      cache: "no-store",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: signal ?? controller?.signal,
    });
  } catch (error) {
    throw new Error(buildTransportErrorMessage(error));
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (res.status === 401) {
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(res, data));
  }

  return normalizeApiResponse(path, data);
}

/* ============================================================================
   PROFILE / USER
============================================================================ */

export const apiResolveHandle = (handle) =>
  api(`/users/by-handle/${encodeURIComponent(String(handle || "").trim())}`);

export const apiPublicProfile = (profileId, token) =>
  api(`/users/profiles/${profileId}`, { token });

export const apiPublicProfileByHandle = (handle, token) =>
  api(
    `/users/profiles/by-handle/${encodeURIComponent(String(handle || "").trim())}`,
    { token }
  );

export const apiMeProfile = (token) => api(`/me`, { token });

export const apiUpdateProfile = (payload, token) =>
  api(`/me/profile`, { method: "PUT", token, body: payload });

export const apiDeleteMe = (token) =>
  api(`/me`, { method: "DELETE", token });

/* ============================================================================
   MEETUPS (CORE PRODUCT)
============================================================================ */

export const apiJoinMeetup = (meetupId, token) =>
  api(`/meetups/${meetupId}/join`, { method: "POST", token });

export const apiLeaveMeetup = (meetupId, token) =>
  api(`/meetups/${meetupId}/leave`, { method: "POST", token });

export const apiUpcomingMeetups = (limit = 10, token) =>
  api(`/meetups/upcoming?limit=${limit}`, { token });

export const apiCreateMyMeetup = (payload, token) =>
  api(`/me/meetups`, {
    method: "POST",
    token,
    body: payload,
  });

export const apiMeetupSearch = (filters = {}, token) => {
  const params = new URLSearchParams();

  const map = {
    q: filters.q,
    level: filters.level,
    from: filters.from,
    to: filters.to,
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

export const apiMyMeetups = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`/me/meetups${qs ? `?${qs}` : ""}`, { token });
};

/* ============================================================================
   LEGACY GROUP COMPATIBILITY (temporary)
   DO NOT USE for navigation or new features
============================================================================ */

export const apiCreateMeetup = (groupId, payload, token) =>
  api(`/groups/${groupId}/meetups`, {
    method: "POST",
    token,
    body: payload,
  });

/* ============================================================================
   NOTIFICATIONS
============================================================================ */

export const apiNotifications = (tab = "all", token) =>
  api(`/notifications?tab=${encodeURIComponent(tab)}`, { token });

export const apiMarkNotifRead = (id, token) =>
  api(`/notifications/${id}/read`, { method: "POST", token });

/* ============================================================================
   MESSAGES
============================================================================ */

export const apiDMThreads = (q = "", token) =>
  api(`/dm/threads${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });

export const apiDMMessages = (threadId, token) =>
  api(`/dm/threads/${threadId}/messages`, { token });

export const apiDMSend = (threadId, text, token) =>
  api(`/dm/threads/${threadId}/messages`, {
    method: "POST",
    token,
    body: { text },
  });
