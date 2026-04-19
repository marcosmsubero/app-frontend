import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiListMyBlockIds } from "../services/api";
import { useAuth } from "./useAuth";

/**
 * Shared block-id state for the whole app.
 *
 * The backend returns the *union* of users I've blocked and users who've
 * blocked me (bidirectional hide). We cache the set in module memory so
 * multiple consumers don't refetch on every mount. Components call
 * `refresh()` after a (un)block action to keep things in sync.
 */

let cachedSet = null;
let inflight = null;
const subscribers = new Set();

function notifyAll(next) {
  cachedSet = next;
  for (const fn of subscribers) {
    try {
      fn(next);
    } catch {
      /* ignore */
    }
  }
}

async function fetchBlockedIds(token) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const ids = await apiListMyBlockIds(token);
      const set = new Set(
        Array.isArray(ids) ? ids.map((n) => String(n)) : []
      );
      notifyAll(set);
      return set;
    } catch {
      // Silent: treat as "no blocks" so the app still renders.
      const empty = cachedSet ?? new Set();
      notifyAll(empty);
      return empty;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function primeBlockedIds(token) {
  return fetchBlockedIds(token);
}

export function useBlockedIds() {
  const { isAuthed, token } = useAuth() || {};
  const [set, setSet] = useState(cachedSet || new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    function onChange(next) {
      if (mountedRef.current) setSet(new Set(next));
    }
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      notifyAll(new Set());
      return;
    }
    if (!cachedSet) {
      fetchBlockedIds(token);
    }
  }, [isAuthed, token]);

  const refresh = useCallback(async () => {
    if (!isAuthed) return new Set();
    cachedSet = null; // force refetch
    return fetchBlockedIds(token);
  }, [isAuthed, token]);

  const isBlocked = useCallback((userId) => {
    if (userId == null) return false;
    return set.has(String(userId));
  }, [set]);

  return useMemo(
    () => ({ blockedIds: set, isBlocked, refresh }),
    [set, isBlocked, refresh]
  );
}

/**
 * Filter a list of items, removing any whose "owner / author" user id is in
 * the blocked set. `getUserId` receives the item and must return a user id.
 */
export function filterByBlocks(items, blockedIds, getUserId) {
  if (!Array.isArray(items) || !blockedIds || blockedIds.size === 0) {
    return items || [];
  }
  return items.filter((item) => {
    const id = getUserId?.(item);
    if (id == null) return true;
    return !blockedIds.has(String(id));
  });
}
