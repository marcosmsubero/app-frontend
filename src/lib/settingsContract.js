export const USER_SETTINGS_DEFAULTS = Object.freeze({
  notifications: {
    messages: true,
    event_reminders: true,
    event_changes: true,
    clubs: true,
    challenges: true,
    weekly_summary: false,
  },
  privacy: {
    profile_visibility: "public", // public | private
    location_visibility: "approximate", // precise | approximate | hidden
    show_event_attendance: true,
    dm_policy: "following", // everyone | following | nobody
  },
  preferences: {
    language: "es",
    theme: "system", // system | light | dark
    distance_unit: "km",
    explore_radius_km: 25,
    default_event_level: "all", // all | beginner | intermediate | advanced
    default_map_app: "internal", // internal | google | apple
    calendar_sync_enabled: false,
  },
  consent: {
    privacy_accepted: false,
    analytics: false,
    marketing_emails: false,
  },
});

function mergeSection(defaults, input) {
  return {
    ...defaults,
    ...(input || {}),
  };
}

export function normalizeUserSettings(input = {}) {
  return {
    notifications: mergeSection(
      USER_SETTINGS_DEFAULTS.notifications,
      input.notifications
    ),
    privacy: mergeSection(USER_SETTINGS_DEFAULTS.privacy, input.privacy),
    preferences: mergeSection(
      USER_SETTINGS_DEFAULTS.preferences,
      input.preferences
    ),
    consent: mergeSection(USER_SETTINGS_DEFAULTS.consent, input.consent),
  };
}
