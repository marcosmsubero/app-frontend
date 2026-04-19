import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PREFERENCES,
  normalizePreferences,
} from "../lib/preferencesContract";
import {
  apiGetMyPreferences,
  apiUpdateMyPreferences,
} from "../services/api";

const STORAGE_KEY = "runvibe:user_preferences";

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizePreferences(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState(() => readCache());
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

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiGetMyPreferences();
      const normalized = normalizePreferences(response.data || {});
      if (mountedRef.current) setPreferences(normalized);
      writeCache(normalized);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "No se pudieron cargar las preferencias.");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const commit = useCallback(async (nextPreferences) => {
    const normalized = normalizePreferences(nextPreferences);
    const previous = preferences;
    setPreferences(normalized); // optimistic
    setSaving(true);
    setError("");
    try {
      const response = await apiUpdateMyPreferences(normalized);
      const serverNormalized = normalizePreferences(response.data || {});
      if (mountedRef.current) setPreferences(serverNormalized);
      writeCache(serverNormalized);
      return serverNormalized;
    } catch (err) {
      // Rollback optimistic change.
      if (mountedRef.current) {
        setPreferences(previous);
        setError(err?.message || "No se pudieron guardar las preferencias.");
      }
      throw err;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [preferences]);

  const setField = useCallback((fieldId, entry) => {
    const next = { ...preferences };
    if (!entry || entry.mode === "off") {
      delete next[fieldId];
    } else {
      next[fieldId] = entry;
    }
    return commit(next);
  }, [preferences, commit]);

  return {
    preferences,
    loading,
    saving,
    error,
    reload: load,
    commit,
    setField,
  };
}
