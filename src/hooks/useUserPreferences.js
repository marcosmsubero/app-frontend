import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * Draft/save model: edits live in `draft` until the user taps "Guardar".
 * `preferences` = last-known server state. `isDirty` = draft diverges from
 * preferences. On save, PATCH fires with the full draft; the server echoes
 * back the normalized payload which becomes the new baseline.
 */
export function useUserPreferences() {
  const initial = readCache();
  const [preferences, setPreferences] = useState(initial);
  const [draft, setDraft] = useState(initial);
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
      if (mountedRef.current) {
        setPreferences(normalized);
        setDraft(normalized);
      }
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

  const setField = useCallback((fieldId, entry) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (!entry || entry.mode === "off") {
        delete next[fieldId];
      } else {
        next[fieldId] = entry;
      }
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const response = await apiUpdateMyPreferences(draft);
      const serverNormalized = normalizePreferences(response.data || {});
      if (mountedRef.current) {
        setPreferences(serverNormalized);
        setDraft(serverNormalized);
      }
      writeCache(serverNormalized);
      return serverNormalized;
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.message || "No se pudieron guardar las preferencias.");
      }
      throw err;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [draft]);

  const discard = useCallback(() => {
    setDraft(preferences);
    setError("");
  }, [preferences]);

  const isDirty = useMemo(() => {
    // Shallow JSON compare is fine — payload is small + flat.
    return JSON.stringify(preferences) !== JSON.stringify(draft);
  }, [preferences, draft]);

  return {
    preferences,
    draft,
    isDirty,
    loading,
    saving,
    error,
    setField,
    save,
    discard,
    reload: load,
  };
}
