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

export async function api(path, { method = "GET", token, body } = {}) {
  const resolvedToken = token ?? (await getAccessToken());

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;

  let res;
  const url = buildApiUrl(path);

  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error("API NETWORK ERROR", { url, method, err });
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
    console.error("API ERROR", {
      url,
      method,
      status: res.status,
      data,
    });

    throw new Error(
      data?.detail || data?.message || `Error ${res.status}: ${res.statusText}`
    );
  }

  return normalizeApiResponse(path, data);
}

/* ============================================================================
   PROFILE / USER
============================================================================ */

export const apiResolveHandle = (handle) =>
  api(`/users/by-handle/${encodeURIComponent(String(handle || "").trim())}`);

export const apiSearchProfiles = (q = "", token) =>
  api(`/users/profiles?q=${encodeURIComponent(q)}&limit=20`, { token });

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

export const apiGetMeetup = (meetupId, token) =>
  api(`/meetups/${meetupId}`, { token });

export const apiCreateMyMeetup = (payload, token) =>
  api(`/me/meetups`, {
    method: "POST",
    token,
    body: payload,
  });

export const apiUpdateMyMeetup = (meetupId, payload, token) =>
  api(`/me/meetups/${Number(meetupId)}`, {
    method: "PUT",
    token,
    body: payload,
  });

export const apiDeleteMyMeetup = (meetupId, token) =>
  api(`/me/meetups/${Number(meetupId)}`, {
    method: "DELETE",
    token,
  });

export const apiMeetupSearch = (filters = {}, token) => {
  const params = new URLSearchParams();

  const map = {
    q: filters.q,
    location: filters.location,
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
   FAVORITES
============================================================================ */

export const apiFavoritesList = (token) => api(`/favorites`, { token });

export const apiFavoriteAdd = (meetupId, token) =>
  api(`/favorites/${meetupId}`, { method: "POST", token });

export const apiFavoriteRemove = (meetupId, token) =>
  api(`/favorites/${meetupId}`, { method: "DELETE", token });

/* ============================================================================
   FOLLOWS
============================================================================ */

export const apiFollowProfile = (profileId, token) =>
  api(`/profiles/${profileId}/follow`, { method: "POST", token });

export const apiUnfollowProfile = (profileId, token) =>
  api(`/profiles/${profileId}/follow`, { method: "DELETE", token });

export const apiProfileFollowers = (profileId, token) =>
  api(`/profiles/${profileId}/followers`, { token });

export const apiProfileFollowing = (profileId, token) =>
  api(`/profiles/${profileId}/following`, { token });

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

export const apiDMCreateThread = (targetUserId, token) =>
  api(`/dm/threads`, {
    method: "POST",
    token,
    body: { target_user_id: targetUserId },
  });

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

/* ============================================================================
   CHALLENGES & GAMIFICATION
============================================================================ */

export const apiChallenges = (token) => api(`/challenges`, { token });

export const apiChallengeJoin = (challengeId, token) =>
  api(`/challenges/${challengeId}/join`, { method: "POST", token });

export const apiChallengeLeave = (challengeId, token) =>
  api(`/challenges/${challengeId}/leave`, { method: "DELETE", token });

export const apiChallengeLeaderboard = (challengeId, token) =>
  api(`/challenges/${challengeId}/leaderboard`, { token });

export const apiMyStats = (token) => api(`/challenges/my-stats`, { token });

/* ============================================================================
   CLUBS
============================================================================ */

export const apiClubsList = (q = "", token) =>
  api(`/clubs${q ? `?q=${encodeURIComponent(q)}` : ""}`, { token });

export const apiClubGet = (clubId, token) =>
  api(`/clubs/${clubId}`, { token });

export const apiClubCreate = (payload, token) =>
  api(`/clubs`, { method: "POST", token, body: payload });

export const apiClubJoin = (clubId, token) =>
  api(`/clubs/${clubId}/join`, { method: "POST", token });

export const apiClubLeave = (clubId, token) =>
  api(`/clubs/${clubId}/leave`, { method: "DELETE", token });

export const apiClubWall = (clubId, token) =>
  api(`/clubs/${clubId}/wall`, { token });

export const apiClubWallPost = (clubId, payload, token) =>
  api(`/clubs/${clubId}/wall`, { method: "POST", token, body: payload });

export const apiClubMembers = (clubId, token) =>
  api(`/clubs/${clubId}/members`, { token });

export const apiClubCreateEvent = (clubId, payload, token) =>
  api(`/clubs/${clubId}/events`, { method: "POST", token, body: payload });

export const apiClubUpdate = (clubId, payload, token) =>
  api(`/clubs/${clubId}`, { method: "PUT", token, body: payload });

export const apiClubMyMemberships = (token) =>
  api(`/clubs/my-memberships`, { token });

/* ============================================================================
   SETTINGS  (server-persisted user preferences)
============================================================================ */

export const apiGetMySettings = (token) => api(`/me/settings`, { token });

export const apiUpdateMySettings = (payload, token) =>
  api(`/me/settings`, { method: "PUT", token, body: payload });

/* ============================================================================
   PREFERENCES  (matching preferences, 17-field catalog)
============================================================================ */

export const apiGetMyPreferences = (token) =>
  api(`/me/preferences`, { token });

export const apiUpdateMyPreferences = (payload, token) =>
  api(`/me/preferences`, { method: "PATCH", token, body: payload });

/* ============================================================================
   BLOCKED USERS
============================================================================ */

export const apiListMyBlocks = (token) => api(`/me/blocks`, { token });

export const apiListMyBlockIds = (token) => api(`/me/blocks/ids`, { token });

export const apiBlockUser = ({ userId, handle } = {}, token) =>
  api(`/me/blocks`, {
    method: "POST",
    token,
    body: {
      user_id: userId ? Number(userId) : undefined,
      handle: handle || undefined,
    },
  });

export const apiUnblockUser = (userId, token) =>
  api(`/me/blocks/${Number(userId)}`, { method: "DELETE", token });

/* ============================================================================
   SUPPORT TICKETS
============================================================================ */

export const apiCreateSupportTicket = (payload, token) =>
  api(`/me/support`, { method: "POST", token, body: payload });

/* ============================================================================
   GDPR DATA EXPORT
============================================================================ */

export const apiExportMyData = (token) => api(`/me/data-export`, { token });

/* ============================================================================
   PROFILE VISITS  (premium — who viewed my profile)
============================================================================ */

// Fire-and-forget recording. Backend silently ignores non-premium or
// opted-out cases, so callers never need to branch.
export const apiRecordProfileVisit = ({ vieweeUserId, source } = {}, token) =>
  api(`/me/profile-visits`, {
    method: "POST",
    token,
    body: {
      viewee_user_id: Number(vieweeUserId),
      source: source || undefined,
    },
  });

export const apiListMyProfileVisits = ({ limit = 50, before } = {}, token) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (before) params.set("before", before);
  const qs = params.toString();
  return api(`/me/profile-visits${qs ? `?${qs}` : ""}`, { token });
};
