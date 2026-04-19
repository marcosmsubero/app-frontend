import { useEffect } from "react";

/**
 * Applies the user's theme preference to <html data-theme="light|dark">
 * so every CSS rule keyed on `:root[data-theme="..."]` resolves correctly.
 *
 * Sources (in priority order):
 *   1. `runvibe:user_settings` in localStorage -> preferences.theme
 *      (maintained by useUserSettings, populated from server or defaults)
 *   2. Fallback: "system" (follow prefers-color-scheme)
 *
 * Reacts to:
 *   - storage events (other tabs)
 *   - custom "runvibe:settings-updated" event (same tab; dispatched by useUserSettings)
 *   - matchMedia changes when the resolved theme is "system"
 */

const SETTINGS_KEY = "runvibe:user_settings";
const VALID_THEMES = new Set(["light", "dark", "system"]);

function readPreferredTheme() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "system";
    const parsed = JSON.parse(raw);
    const t = parsed?.preferences?.theme;
    if (VALID_THEMES.has(t)) return t;
  } catch {
    /* ignore */
  }
  return "system";
}

function resolveTheme(pref) {
  if (pref === "light" || pref === "dark") return pref;
  try {
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    return mql.matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(resolved) {
  const html = document.documentElement;
  if (!html) return;
  html.setAttribute("data-theme", resolved);
  // Ensure UA-rendered controls (form widgets, scrollbars) match.
  html.style.colorScheme = resolved;
}

export function useAppliedTheme() {
  useEffect(() => {
    let currentPref = readPreferredTheme();
    applyTheme(resolveTheme(currentPref));

    let mql = null;
    let mqlHandler = null;

    function attachSystemListener() {
      if (mql) return;
      try {
        mql = window.matchMedia("(prefers-color-scheme: light)");
        mqlHandler = () => applyTheme(resolveTheme(currentPref));
        if (mql.addEventListener) mql.addEventListener("change", mqlHandler);
        else if (mql.addListener) mql.addListener(mqlHandler); // Safari <14
      } catch {
        /* ignore */
      }
    }

    function detachSystemListener() {
      if (!mql || !mqlHandler) return;
      try {
        if (mql.removeEventListener) mql.removeEventListener("change", mqlHandler);
        else if (mql.removeListener) mql.removeListener(mqlHandler);
      } catch {
        /* ignore */
      }
      mql = null;
      mqlHandler = null;
    }

    function refresh() {
      currentPref = readPreferredTheme();
      if (currentPref === "system") {
        attachSystemListener();
      } else {
        detachSystemListener();
      }
      applyTheme(resolveTheme(currentPref));
    }

    if (currentPref === "system") attachSystemListener();

    function onStorage(e) {
      if (e.key === SETTINGS_KEY || e.key === null) refresh();
    }
    function onInternal() {
      refresh();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("runvibe:settings-updated", onInternal);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("runvibe:settings-updated", onInternal);
      detachSystemListener();
    };
  }, []);
}

/** Imperative helper for code paths that mutate localStorage directly. */
export function notifyThemeChanged() {
  try {
    window.dispatchEvent(new Event("runvibe:settings-updated"));
  } catch {
    /* ignore */
  }
}
