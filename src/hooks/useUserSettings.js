import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  USER_SETTINGS_DEFAULTS,
  normalizeUserSettings,
} from "../lib/settingsContract";
import { apiGetMySettings, apiUpdateMySettings } from "../services/api";

const STORAGE_KEY = "runvibe:user_settings";

/**
 * Hook for user settings with offline-first behaviour:
 *   1. Read the last-known settings from localStorage for instant paint.
 *   2. Fetch authoritative state from the backend in the background.
 *   3. Writes go to the backend; on success the localStorage cache is
 *      refreshed. If the backend call fails we roll back the optimistic
 *      change and surface an error so the user sees something went wrong.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeUserSettings(raw ? JSON.parse(raw) : {});
    } catch {
      return normalizeUserSettings(USER_SETTINGS_DEFAULTS);
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const persistLocal = useCallback((value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* quota / private mode — ignore */
    }
    // Notify other parts of the app (notably useAppliedTheme) that
    // settings have changed in the current tab. Storage events only
    // fire cross-tab, so we also emit a same-tab DOM event.
    try {
      window.dispatchEvent(new Event("runvibe:settings-updated"));
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetMySettings();
      const normalized = normalizeUserSettings(data);
      if (mountedRef.current) {
        setSettings(normalized);
      }
      persistLocal(normalized);
    } catch (err) {
      // Backend unreachable / unauthenticated — stay on cached settings.
      if (mountedRef.current) {
        setError(err?.message || "No se pudieron cargar tus ajustes.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [persistLocal]);

  useEffect(() => {
    load();
  }, [load]);

  const commit = useCallback(
    async (nextSettings) => {
      const normalized = normalizeUserSettings(nextSettings);
      const previous = settings;

      // Optimistic update
      setSettings(normalized);
      persistLocal(normalized);
      setSaving(true);
      setError("");

      try {
        const saved = await apiUpdateMySettings({
          notifications: normalized.notifications,
          privacy: normalized.privacy,
          preferences: normalized.preferences,
          consent: normalized.consent,
        });
        const merged = normalizeUserSettings(saved);
        if (mountedRef.current) setSettings(merged);
        persistLocal(merged);
        return merged;
      } catch (err) {
        // Roll back on failure so the UI matches the server state.
        if (mountedRef.current) {
          setSettings(previous);
          setError(err?.message || "No se pudieron guardar los ajustes.");
        }
        persistLocal(previous);
        throw err;
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [settings, persistLocal]
  );

  const saveAll = useCallback(
    (nextSettings) => commit(nextSettings),
    [commit]
  );

  const updateSection = useCallback(
    (section, patch) => {
      const next = {
        ...settings,
        [section]: {
          ...(settings?.[section] || {}),
          ...(patch || {}),
        },
      };
      return commit(next);
    },
    [settings, commit]
  );

  const resetSettings = useCallback(
    () => commit(USER_SETTINGS_DEFAULTS),
    [commit]
  );

  return useMemo(
    () => ({
      settings,
      loading,
      saving,
      error,
      reload: load,
      saveAll,
      updateSection,
      resetSettings,
    }),
    [
      settings,
      loading,
      saving,
      error,
      load,
      saveAll,
      updateSection,
      resetSettings,
    ]
  );
}
