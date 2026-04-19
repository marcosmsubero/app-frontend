export const USER_CONTRACT_DEFAULTS = Object.freeze({
  id: null,
  app_profile_id: null,
  profile_type: "individual",
  supabase_user_id: null,
  email: null,
  handle: null,
  full_name: null,
  display_name: null,
  bio: null,
  location: null,
  links: {},
  avatar_url: null,
  members: [],
  is_deleted: false,
  email_verified: false,
  location_verified: false,
  location_verified_at: null,
  onboarding_completed: false,
  is_premium: false,
  followers_count: 0,
  following_count: 0,
  created_at: null,
  updated_at: null,
});

function normalizeMember(member = {}) {
  return {
    user_id:
      member.user_id === null || member.user_id === undefined || member.user_id === ""
        ? null
        : Number(member.user_id),
    profile_id:
      member.profile_id === null || member.profile_id === undefined || member.profile_id === ""
        ? null
        : Number(member.profile_id),
    handle:
      typeof member.handle === "string" && member.handle.trim()
        ? member.handle.trim().replace(/^@+/, "")
        : null,
    full_name:
      typeof member.full_name === "string" && member.full_name.trim()
        ? member.full_name.trim()
        : null,
    avatar_url:
      typeof member.avatar_url === "string" && member.avatar_url.trim()
        ? member.avatar_url.trim()
        : null,
    role:
      typeof member.role === "string" && member.role.trim()
        ? member.role.trim()
        : "member",
  };
}

export function normalizeUserContract(input = {}) {
  const data = { ...USER_CONTRACT_DEFAULTS, ...(input || {}) };

  const fullName =
    typeof data.full_name === "string" && data.full_name.trim()
      ? data.full_name.trim()
      : null;

  const displayName =
    typeof data.display_name === "string" && data.display_name.trim()
      ? data.display_name.trim()
      : fullName;

  return {
    ...data,
    id:
      data.id === null || data.id === undefined || data.id === ""
        ? null
        : Number.isNaN(Number(data.id))
          ? data.id
          : Number(data.id),
    app_profile_id:
      data.app_profile_id === null ||
      data.app_profile_id === undefined ||
      data.app_profile_id === ""
        ? null
        : Number.isNaN(Number(data.app_profile_id))
          ? null
          : Number(data.app_profile_id),
    profile_type: data.profile_type === "group" ? "group" : "individual",
    supabase_user_id:
      typeof data.supabase_user_id === "string" && data.supabase_user_id.trim()
        ? data.supabase_user_id.trim()
        : null,
    email:
      typeof data.email === "string" && data.email.trim()
        ? data.email.trim().toLowerCase()
        : null,
    handle:
      typeof data.handle === "string" && data.handle.trim()
        ? data.handle.trim().replace(/^@+/, "")
        : null,
    full_name: fullName,
    display_name: displayName,
    bio:
      typeof data.bio === "string" && data.bio.trim()
        ? data.bio.trim()
        : null,
    location:
      typeof data.location === "string" && data.location.trim()
        ? data.location.trim()
        : null,
    links:
      data.links && typeof data.links === "object" && !Array.isArray(data.links)
        ? data.links
        : {},
    avatar_url:
      typeof data.avatar_url === "string" && data.avatar_url.trim()
        ? data.avatar_url.trim()
        : null,
    members: Array.isArray(data.members) ? data.members.map(normalizeMember) : [],
    is_deleted: Boolean(data.is_deleted),
    email_verified: Boolean(data.email_verified),
    location_verified: Boolean(data.location_verified),
    location_verified_at: data.location_verified_at || null,
    onboarding_completed: Boolean(data.onboarding_completed),
    is_premium: Boolean(data.is_premium),
    followers_count: Number(data.followers_count ?? 0) || 0,
    following_count: Number(data.following_count ?? 0) || 0,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null,
  };
}

export function isOnboardingComplete(user) {
  return Boolean(normalizeUserContract(user).onboarding_completed);
}

export function getPreferredLoginIdentifier(value = "") {
  const raw = String(value || "").trim();

  if (!raw) {
    return { type: "empty", value: "" };
  }

  if (raw.includes("@") && !raw.startsWith("@")) {
    return { type: "email", value: raw.toLowerCase() };
  }

  return {
    type: "handle",
    value: raw.replace(/^@+/, "").toLowerCase(),
  };
}
