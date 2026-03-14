import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { EVENTS_URL } from "../config/api";

export default function SSEListener() {
  const { token, isAuthed } = useAuth();
  const esRef = useRef(null);

  const eventsUrl = useMemo(() => {
    if (!token) return null;

    const url = new URL(EVENTS_URL);
    url.searchParams.set("token", token);
    return url.toString();
  }, [token]);

  useEffect(() => {
    if (!isAuthed || !eventsUrl) return undefined;

    const es = new EventSource(eventsUrl);
    esRef.current = es;

    es.onopen = () => {
      console.log("[SSE] connected");
    };

    es.onerror = (err) => {
      console.error("[SSE] error", err);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isAuthed, eventsUrl]);

  return null;
}
