import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";

export function useUpcomingMeetups(token, toast) {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inFlightRef = useRef(false);
  const lastToastAtRef = useRef(0);

  const safeToastError = (msg) => {
    const now = Date.now();
    if (now - lastToastAtRef.current > 4000) {
      lastToastAtRef.current = now;
      toast?.error?.(msg);
    }
  };

  const fetchUpcoming = useCallback(async () => {
    if (!token) {
      setMeetups([]);
      setLoading(false);
      setError("");
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setLoading(true);
    setError("");

    try {
      const data = await api("/meetups/upcoming?limit=10", { token });
      setMeetups(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.message || "Error cargando agenda";
      setMeetups([]);
      setError(msg);
      safeToastError(msg);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const reload = useCallback(() => fetchUpcoming(), [fetchUpcoming]);

  return { meetups, loading, error, reload };
}
