import { useEffect, useMemo, useRef } from "react";
import { buildEventStreamUrl } from "../config/api";
import { useAuth } from "../hooks/useAuth";

export default function SSEListener() {
  const { token, isAuthed } = useAuth();
  const esRef = useRef(null);

  const eventsUrl = useMemo(() => buildEventStreamUrl(token), [token]);

  useEffect(() => {
    if (!isAuthed || !eventsUrl) return undefined;

    const es = new EventSource(eventsUrl);
    esRef.current = es;

    es.addEventListener("READY", () => {
      // conexión establecida
    });

    es.onerror = () => {
      // EventSource reintenta automáticamente.
      // Evitamos ruido en consola en producción.
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isAuthed, eventsUrl]);

  return null;
}
