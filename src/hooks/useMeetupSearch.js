import { useCallback, useEffect, useRef, useState } from "react";
import { apiMeetupSearch } from "../services/api";
import { useAuth } from "./useAuth";

/**
 * Hook para búsqueda global de quedadas (BlaBlaRun)
 * Estabilizado para evitar re-renders con cierres obsoletos
 * y refrescos repetidos innecesarios.
 */
export function useMeetupSearch(initialFilters = {}) {
  const { isAuthed, token } = useAuth();

  const initialStateRef = useRef({
    q: "",
    level: "",
    from: "",
    to: "",
    pace_min: "",
    pace_max: "",
    only_open: true,
    limit: 30,
    offset: 0,
    ...initialFilters,
  });

  const [filters, setFilters] = useState(initialStateRef.current);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtersRef = useRef(initialStateRef.current);
  const reqId = useRef(0);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const run = useCallback(
    async (override = {}) => {
      const next = { ...filtersRef.current, ...override };

      filtersRef.current = next;
      setFilters(next);

      if (!isAuthed) {
        setItems([]);
        setLoading(false);
        setError("Inicia sesión para explorar quedadas.");
        return [];
      }

      const myReq = ++reqId.current;
      setLoading(true);
      setError("");

      try {
        const data = await apiMeetupSearch(next, token);
        if (myReq !== reqId.current) return [];
        const normalized = Array.isArray(data) ? data : [];
        setItems(normalized);
        return normalized;
      } catch (e) {
        if (myReq !== reqId.current) return [];
        setItems([]);
        setError(e?.message || "Error buscando quedadas");
        return [];
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
        }
      }
    },
    [isAuthed, token]
  );

  useEffect(() => {
    if (!isAuthed) {
      setItems([]);
      setError("Inicia sesión para explorar quedadas.");
      setLoading(false);
      return;
    }

    run();
  }, [isAuthed, run]);

  return {
    filters,
    setFilters,
    items,
    loading,
    error,
    run,
  };
}