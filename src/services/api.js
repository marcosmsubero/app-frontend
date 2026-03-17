import API_BASE, { buildApiUrl } from "../config/api.js";
import { supabase } from "../lib/supabase.js";
import { normalizeUserContract } from "../lib/userContract.js";

export { API_BASE };

async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

async function normalizeApiResponse(path, data) {
  if (!data) return data;

  if (path === "/me" || path === "/auth/me") {
    return normalizeUserContract(data);
  }

  if (
    path === "/me/profile" &&
    data?.user &&
    typeof data.user === "object" &&
    !Array.isArray(data.user)
  ) {
    return {
      ...data,
      user: normalizeUserContract(data.user),
    };
  }

  if (
    ["/me/avatar", "/me/send-verification-code", "/me/verify-email", "/me/verify-location"].includes(path) &&
    data?.user &&
    typeof data.user === "object" &&
    !Array.isArray(data.user)
  ) {
    return {
      ...data,
      user: normalizeUserContract(data.user),
    };
  }

  return data;
}

export async function api(path, { method = "GET", token, body } = {}) {
  const resolvedToken = token ?? (await getAccessToken());

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (resolvedToken) headers["Authorization"] = `Bearer ${resolvedToken}`;

  let res;

  try {
    res = await fetch(buildApiUrl(path), {
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

  if (res.status === 401) {
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    throw new Error(
      data?.detail || data?.message || `Error ${res.status}: ${res.statusText}`
    );
  }

  return normalizeApiResponse(path, data);
}

export const apiResolveHandle = (handle) =>
  api(`/users/by-handle/${encodeURIComponent(String(handle || "").trim())}`);

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

export const apiMeProfile = (token) => api(`/me`, { token });

export const apiUpdateProfile = (payload, token) =>
  api(`/me/profile`, { method: "PUT", token, body: payload });

export const apiUpdatePassword = (payload, token) =>
  api(`/me/password`, { method: "PUT", token, body: payload });

export const apiMyMeetups = (token, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return api(`/me/meetups${qs ? `?${qs}` : ""}`, { token });
};

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
  api(`/dm/threads/${threadId}/messages`, {
    method: "POST",
    token,
    body: { text },
  });

export const apiVerifyEmailStart = (token) =>
  api(`/me/send-verification-code`, { method: "POST", token });

export const apiVerifyEmailConfirm = (code, token) =>
  api(`/me/verify-email`, {
    method: "POST",
    token,
    body: { code },
  });

export const apiVerifyLocation = (lat, lng, accuracy_m, token) =>
  api(`/me/verify-location`, {
    method: "POST",
    token,
    body: { lat, lng, accuracy_m },
  });
