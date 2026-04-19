/**
 * RunVibe Analytics — Lightweight event tracking.
 *
 * Supports two modes:
 * 1. PostHog (if VITE_POSTHOG_KEY is set)
 * 2. Custom backend endpoint (/analytics/events)
 * 3. Console-only fallback (development)
 *
 * Usage:
 *   import { track, identify, pageView } from "../services/analytics";
 *   track("event_joined", { event_id: 123 });
 *   identify(userId, { email, name });
 *   pageView("/eventos");
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://eu.posthog.com";
const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT || "";
const IS_DEV = import.meta.env.DEV;

let posthogLoaded = false;

// ── PostHog lazy loader ──────────────────────────────────────

function loadPostHog() {
  if (posthogLoaded || !POSTHOG_KEY) return;
  posthogLoaded = true;

  try {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://eu-assets.i.posthog.com/static/array.js";
    script.onload = () => {
      if (window.posthog) {
        window.posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: false,
          capture_pageview: false,
          persistence: "localStorage",
        });
      }
    };
    document.head.appendChild(script);
  } catch {}
}

// ── Queue for events before PostHog loads ────────────────────

const queue = [];

function flush() {
  if (!window.posthog) return;
  while (queue.length > 0) {
    const { type, args } = queue.shift();
    if (type === "track") window.posthog.capture(...args);
    else if (type === "identify") window.posthog.identify(...args);
    else if (type === "page") window.posthog.capture("$pageview", ...args);
  }
}

// ── Send to custom backend ───────────────────────────────────

function sendToBackend(eventName, properties = {}) {
  if (!ANALYTICS_ENDPOINT) return;

  try {
    const payload = {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer || null,
    };

    // Use sendBeacon for reliability (works even on page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

// ── Public API ───────────────────────────────────────────────

export function initAnalytics() {
  if (POSTHOG_KEY) {
    loadPostHog();
    // Retry flush every 2s until PostHog is ready
    const interval = setInterval(() => {
      if (window.posthog) {
        flush();
        clearInterval(interval);
      }
    }, 2000);
    setTimeout(() => clearInterval(interval), 15000);
  }
}

export function track(eventName, properties = {}) {
  if (IS_DEV) {
    console.debug("[analytics]", eventName, properties);
  }

  if (POSTHOG_KEY) {
    if (window.posthog) {
      window.posthog.capture(eventName, properties);
    } else {
      queue.push({ type: "track", args: [eventName, properties] });
    }
  }

  sendToBackend(eventName, properties);
}

export function identify(userId, traits = {}) {
  if (IS_DEV) {
    console.debug("[analytics] identify", userId, traits);
  }

  if (POSTHOG_KEY) {
    if (window.posthog) {
      window.posthog.identify(String(userId), traits);
    } else {
      queue.push({ type: "identify", args: [String(userId), traits] });
    }
  }
}

export function pageView(path) {
  track("$pageview", { $current_url: path || window.location.href });
}

// ── Predefined events (type-safe helpers) ────────────────────

export const AnalyticsEvents = {
  // Auth
  signUp: (method) => track("sign_up", { method }),
  login: (method) => track("login", { method }),
  logout: () => track("logout"),

  // Events
  eventCreated: (eventId) => track("event_created", { event_id: eventId }),
  eventJoined: (eventId) => track("event_joined", { event_id: eventId }),
  eventLeft: (eventId) => track("event_left", { event_id: eventId }),
  eventViewed: (eventId) => track("event_viewed", { event_id: eventId }),

  // Social
  profileViewed: (profileId) => track("profile_viewed", { profile_id: profileId }),
  followed: (profileId) => track("followed", { profile_id: profileId }),
  unfollowed: (profileId) => track("unfollowed", { profile_id: profileId }),
  messageSent: (threadId) => track("message_sent", { thread_id: threadId }),

  // Challenges
  challengeJoined: (challengeId) => track("challenge_joined", { challenge_id: challengeId }),
  challengeCompleted: (challengeId) => track("challenge_completed", { challenge_id: challengeId }),

  // Clubs
  clubCreated: (clubId) => track("club_created", { club_id: clubId }),
  clubJoined: (clubId) => track("club_joined", { club_id: clubId }),
};
