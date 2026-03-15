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
})

export function normalizeUserContract(input = {}) {
  const data = { ...USER_CONTRACT_DEFAULTS, ...(input || {}) }

  return {
    ...data,
    disciplines: Array.isArray(data.disciplines) ? data.disciplines : [],
    links: data.links && typeof data.links === "object" && !Array.isArray(data.links) ? data.links : {},
    is_deleted: Boolean(data.is_deleted),
    email_verified: Boolean(data.email_verified),
    location_verified: Boolean(data.location_verified),
    onboarding_completed: Boolean(data.onboarding_completed),
  }
}

export function isOnboardingComplete(user) {
  return Boolean(user?.onboarding_completed)
}
