import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { apiMyMeetups } from "../services/api";

export function useMyMeetups(params = {}) {
  const { token, isAuthed } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ estabiliza params para que NO cambie en cada render
  const paramsKey = useMemo(() => JSON.stringify(params || {}), [params]);

  const reqId = useRef(0);

  const reload = useCallback(async () => {
    if (!isAuthed || !token) {
      setItems([]);
      setError("");
      setLoading(false);
      return;
    }

    const myReq = ++reqId.current;
    setLoading(true);
    setError("");

    try {
      const data = await apiMyMeetups(token, JSON.parse(paramsKey));
      if (myReq !== reqId.current) return;
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      if (myReq !== reqId.current) return;
      setItems([]);
      setError(e?.message || "Error cargando tus actividades");
    } finally {
      if (myReq === reqId.current) setLoading(false);
    }
  }, [isAuthed, token, paramsKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}
