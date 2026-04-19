import { useEffect, useLayoutEffect, useRef } from "react";

const STORAGE_PREFIX = "runvibe:draft:";
const SCROLL_SUFFIX = ":scroll";

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getValueKey(storageKey) {
  return `${STORAGE_PREFIX}${storageKey}`;
}

function getScrollKey(storageKey) {
  return `${STORAGE_PREFIX}${storageKey}${SCROLL_SUFFIX}`;
}

export function readDraftSnapshot(storageKey, fallbackValue, version = 1) {
  const storage = getStorage();
  if (!storage || !storageKey) return fallbackValue;

  try {
    const raw = storage.getItem(getValueKey(storageKey));
    if (!raw) return fallbackValue;

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== version || !("value" in parsed)) {
      return fallbackValue;
    }

    return parsed.value;
  } catch {
    return fallbackValue;
  }
}

export function clearDraftSnapshot(storageKey) {
  const storage = getStorage();
  if (!storage || !storageKey) return;

  try {
    storage.removeItem(getValueKey(storageKey));
    storage.removeItem(getScrollKey(storageKey));
  } catch {
    // ignore storage failures
  }
}

function saveDraftSnapshot(storageKey, value, version = 1) {
  const storage = getStorage();
  if (!storage || !storageKey) return;

  try {
    storage.setItem(
      getValueKey(storageKey),
      JSON.stringify({
        version,
        updatedAt: Date.now(),
        value,
      })
    );
  } catch {
    // ignore storage failures
  }
}

function saveScrollPosition(storageKey) {
  const storage = getStorage();
  if (!storage || !storageKey || typeof window === "undefined") return;

  try {
    storage.setItem(
      getScrollKey(storageKey),
      JSON.stringify({
        y: Math.max(0, Number(window.scrollY || window.pageYOffset || 0)),
        updatedAt: Date.now(),
      })
    );
  } catch {
    // ignore storage failures
  }
}

function readScrollPosition(storageKey) {
  const storage = getStorage();
  if (!storage || !storageKey) return null;

  try {
    const raw = storage.getItem(getScrollKey(storageKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const y = Number(parsed?.y);

    if (!Number.isFinite(y) || y < 0) return null;
    return y;
  } catch {
    return null;
  }
}

export function useFormDraft({
  storageKey,
  value,
  enabled = true,
  version = 1,
  restoreScroll = true,
}) {
  const latestValueRef = useRef(value);
  const restoredScrollRef = useRef(false);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled || !storageKey) return;
    saveDraftSnapshot(storageKey, value, version);
  }, [enabled, storageKey, value, version]);

  useEffect(() => {
    if (!enabled || !storageKey) return;

    const persistAll = () => {
      saveDraftSnapshot(storageKey, latestValueRef.current, version);
      if (restoreScroll) saveScrollPosition(storageKey);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistAll();
      }
    };

    window.addEventListener("pagehide", persistAll);
    window.addEventListener("beforeunload", persistAll);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      persistAll();
      window.removeEventListener("pagehide", persistAll);
      window.removeEventListener("beforeunload", persistAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, restoreScroll, storageKey, version]);

  useLayoutEffect(() => {
    if (!enabled || !storageKey || !restoreScroll || restoredScrollRef.current) return;

    const y = readScrollPosition(storageKey);
    if (y === null) {
      restoredScrollRef.current = true;
      return;
    }

    restoredScrollRef.current = true;

    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "auto" });
      });

      return () => window.cancelAnimationFrame(raf2);
    });

    return () => {
      window.cancelAnimationFrame(raf1);
    };
  }, [enabled, restoreScroll, storageKey]);

  return {
    clearDraft: () => clearDraftSnapshot(storageKey),
  };
}
