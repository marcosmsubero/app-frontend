import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { emit } from "../utils/events";

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function useLiveMeetupEvents({ enabled, onAgendaUpdate }) {
  const [toasts, setToasts] = useState([]);
  const esRef = useRef(null);

  const API_BASE = useMemo(() => {
    const fallback = `http://${window.location.hostname}:8000`;
    return import.meta.env.VITE_API_BASE || fallback;
  }, []);

  const pushToast = useCallback((toast) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    setToasts((prev) => [...prev, { id, duration: 3500, type: "info", ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (!enabled) {
      esRef.current?.close?.();
      esRef.current = null;
      return;
    }

    if (esRef.current) return;

    const es = new EventSource(`${API_BASE}/events`);
    esRef.current = es;

    const touchAgenda = (type) => {
      onAgendaUpdate?.();
      emit("meetup_changed", { type });
    };

    const handleMeetupCreated = async (event) => {
      touchAgenda("created_sse");

      const payload = safeParseJSON(event.data);
      const groupName = payload?.group_name;
      const meetingPoint = payload?.meeting_point;
      const startsAt = payload?.starts_at;

      if (groupName && meetingPoint) {
        pushToast({
          type: "success",
          title: `Nueva quedada en ${groupName}`,
          message: [`📍 ${meetingPoint}`, startsAt ? `🕒 ${fmtTime(startsAt)}` : ""]
            .filter(Boolean)
            .join(" · "),
        });
        return;
      }

      const meetupId = payload?.id;
      if (!meetupId) {
        pushToast({
          type: "success",
          title: "Nueva quedada",
          message: "Se ha creado una nueva quedada.",
        });
        return;
      }

      try {
        const meetup = await api(`/meetups/${meetupId}`);
        const remoteGroupName = meetup?.group?.name || "un grupo";
        const meetingPointText = meetup?.meeting_point ? `📍 ${meetup.meeting_point}` : "";
        const timeText = meetup?.starts_at ? `🕒 ${fmtTime(meetup.starts_at)}` : "";

        pushToast({
          type: "success",
          title: `Nueva quedada en ${remoteGroupName}`,
          message:
            [meetingPointText, timeText].filter(Boolean).join(" · ") ||
            "Se ha creado una nueva quedada.",
        });
      } catch {
        pushToast({
          type: "success",
          title: "Nueva quedada",
          message: "Se ha creado una nueva quedada.",
        });
      }
    };

    const handleSimpleEvent = ({ type, toastType, title, message }) => {
      touchAgenda(type);
      pushToast({ type: toastType, title, message });
    };

    const handleGroupDeleted = (event) => {
      touchAgenda("group_deleted_sse");
      const payload = safeParseJSON(event.data);
      const groupId = payload?.group_id ? Number(payload.group_id) : null;

      pushToast({
        type: "warn",
        title: "Grupo eliminado",
        message: groupId
          ? `Se ha eliminado el grupo #${groupId}.`
          : "Se ha eliminado un grupo.",
      });
    };

    es.addEventListener("MEETUP_CREATED", handleMeetupCreated);

    es.addEventListener("MEETUP_JOINED", () =>
      handleSimpleEvent({
        type: "joined_sse",
        toastType: "info",
        title: "Actualización",
        message: "Alguien se ha apuntado a una quedada.",
      })
    );

    es.addEventListener("MEETUP_LEFT", () =>
      handleSimpleEvent({
        type: "left_sse",
        toastType: "info",
        title: "Actualización",
        message: "Alguien se ha desapuntado de una quedada.",
      })
    );

    es.addEventListener("MEETUP_CANCELLED", () =>
      handleSimpleEvent({
        type: "cancelled_sse",
        toastType: "warn",
        title: "Quedada cancelada",
        message: "Se ha cancelado una quedada.",
      })
    );

    es.addEventListener("MEETUP_DONE", () =>
      handleSimpleEvent({
        type: "done_sse",
        toastType: "success",
        title: "Quedada finalizada",
        message: "Una quedada se ha marcado como hecha.",
      })
    );

    es.addEventListener("GROUP_DELETED", handleGroupDeleted);

    es.onerror = () => {};

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [API_BASE, enabled, onAgendaUpdate, pushToast]);

  return {
    toasts,
    removeToast,
  };
}
