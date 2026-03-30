export const USER_CONTRACT_DEFAULTS = Object.freeze({
  id: null,
  supabase_user_id: null,
  email: null,
  handle: null,
  full_name: null,
  bio: null,
  role: null,
  location: null,
  disciplines: [],
  links: {},
  avatar_url: null,
  is_deleted: false,
  email_verified: false,
  location_verified: false,
  location_verified_at: null,
  onboarding_completed: false,
  created_at: null,
  updated_at: null,
});

export function normalizeUserContract(input = {}) {
  const data = { ...USER_CONTRACT_DEFAULTS, ...(input || {}) };

  return {
    ...data,
    id:
      data.id === null || data.id === undefined || data.id === ""
        ? null
        : Number.isNaN(Number(data.id))
          ? data.id
          : Number(data.id),
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
    full_name:
      typeof data.full_name === "string" && data.full_name.trim()
        ? data.full_name.trim()
        : null,
    bio:
      typeof data.bio === "string" && data.bio.trim()
        ? data.bio.trim()
        : null,
    role:
      typeof data.role === "string" && data.role.trim()
        ? data.role.trim()
        : null,
    location:
      typeof data.location === "string" && data.location.trim()
        ? data.location.trim()
        : null,
    disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
    links:
      data.links && typeof data.links === "object" && !Array.isArray(data.links)
        ? data.links
        : {},
    avatar_url:
      typeof data.avatar_url === "string" && data.avatar_url.trim()
        ? data.avatar_url.trim()
        : null,
    is_deleted: Boolean(data.is_deleted),
    email_verified: Boolean(data.email_verified),
    location_verified: Boolean(data.location_verified),
    location_verified_at: data.location_verified_at || null,
    onboarding_completed: Boolean(data.onboarding_completed),
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
