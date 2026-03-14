import { useEffect, useMemo, useRef } from "react";
import { emit } from "../utils/events";
import { useAuth } from "../hooks/useAuth";

/**
 * Enruta eventos de DM al "bus" global del chat.
 * Espera payloads tipo:
 *  - { type: "dm_message", thread_id, from, text, created_at, id }
 *  - { type: "dm_typing", thread_id, from }
 *  - { type: "dm_read", thread_id, from }
 */
function emitDmIfNeeded(payload) {
  const type = payload?.type;

  if (type === "dm_message") {
    window.dispatchEvent(new CustomEvent("dm:message", { detail: payload }));
  } else if (type === "dm_typing") {
    window.dispatchEvent(new CustomEvent("dm:typing", { detail: payload }));
  } else if (type === "dm_read") {
    window.dispatchEvent(new CustomEvent("dm:read", { detail: payload }));
  }
}

export default function SSEListener() {
  const { isAuthed } = useAuth();

  const API_BASE = useMemo(() => {
    const fallback = "https://app-backend-jd8f.onrender.com";
    return import.meta.env.VITE_API_BASE || fallback;
  }, []);

  const esRef = useRef(null);

  useEffect(() => {
    if (!isAuthed) {
      esRef.current?.close?.();
      esRef.current = null;
      return;
    }

    if (esRef.current) return;

    const es = new EventSource(`${API_BASE}/events`);
    esRef.current = es;

    // =========================
    // Meetups (ya existente)
    // =========================
    const ping = (type) => emit("meetup_changed", { type });

    es.addEventListener("MEETUP_CREATED", () => ping("created_sse"));
    es.addEventListener("MEETUP_JOINED", () => ping("joined_sse"));
    es.addEventListener("MEETUP_LEFT", () => ping("left_sse"));
    es.addEventListener("MEETUP_CANCELLED", () => ping("cancelled_sse"));
    es.addEventListener("MEETUP_DONE", () => ping("done_sse"));
    es.addEventListener("GROUP_DELETED", () => ping("group_deleted_sse"));

    // =========================
    // DM (si el backend emite eventos por nombre)
    // =========================
    es.addEventListener("DM_MESSAGE", (e) => {
      try {
        const payload = e?.data ? JSON.parse(e.data) : null;
        if (!payload) return;
        emitDmIfNeeded({ ...payload, type: "dm_message" });
      } catch {
        // ignore
      }
    });

    es.addEventListener("DM_TYPING", (e) => {
      try {
        const payload = e?.data ? JSON.parse(e.data) : null;
        if (!payload) return;
        emitDmIfNeeded({ ...payload, type: "dm_typing" });
      } catch {
        // ignore
      }
    });

    es.addEventListener("DM_READ", (e) => {
      try {
        const payload = e?.data ? JSON.parse(e.data) : null;
        if (!payload) return;
        emitDmIfNeeded({ ...payload, type: "dm_read" });
      } catch {
        // ignore
      }
    });

    // =========================
    // Fallback: si el backend usa "message" genérico con payload.type
    // =========================
    es.onmessage = (e) => {
      try {
        const payload = e?.data ? JSON.parse(e.data) : null;
        if (!payload) return;
        emitDmIfNeeded(payload);
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      // EventSource reintenta solo
    };

    return () => {
      esRef.current?.close?.();
      esRef.current = null;
    };
  }, [API_BASE, isAuthed]);

  return null;
}
