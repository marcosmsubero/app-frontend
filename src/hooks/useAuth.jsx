import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { api, apiMeProfile, apiDeleteMe } from "../services/api";

const AuthContext = createContext(null);

function isNetworkLikeError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("no se puede conectar") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("fetch")
  );
}

function isAuthExpiredError(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("sesión expirada") || msg.includes("401") || msg.includes("unauthorized");
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!token && !!me;

  const setAuthToken = useCallback((t) => {
    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setMe(null);
  }, [setAuthToken]);

  const refreshMe = useCallback(
    async (t = token) => {
      if (!t) return null;
      const data = await apiMeProfile(t);
      setMe(data);
      return data;
    },
    [token]
  );

  const login = useCallback(
    async (email, password) => {
      if (!email || !password) throw new Error("Introduce email y contraseña");

      const res = await api("/auth/login", {
        method: "POST",
        body: { email, password },
        token: null,
      });

      const t = res?.access_token || res?.token;
      if (!t) throw new Error("Respuesta inválida del servidor");

      setAuthToken(t);

      try {
        await refreshMe(t);
      } catch (err) {
        if (isAuthExpiredError(err)) {
          logout();
          throw err;
        }
        setMe(null);
      }

      return t;
    },
    [refreshMe, logout, setAuthToken]
  );

  const register = useCallback(
    async (email, password) => {
      if (!email || !password) throw new Error("Introduce email y contraseña");

      const res = await api("/auth/register", {
        method: "POST",
        body: { email, password },
        token: null,
      });

      const t = res?.access_token || res?.token;
      if (!t) throw new Error("Respuesta inválida del servidor");

      setAuthToken(t);

      try {
        await refreshMe(t);
      } catch (err) {
        if (isAuthExpiredError(err)) {
          logout();
          throw err;
        }
        setMe(null);
      }

      return t;
    },
    [refreshMe, logout, setAuthToken]
  );

  const deleteAccount = useCallback(async () => {
    if (!token) throw new Error("No hay sesión activa");
    await apiDeleteMe(token);
    logout();
    return true;
  }, [token, logout]);

  useEffect(() => {
    let alive = true;

    async function loadMe() {
      if (!token) {
        if (!alive) return;
        setMe(null);
        setLoading(false);
        return;
      }

      if (alive) setLoading(true);

      try {
        const data = await apiMeProfile(token);
        if (!alive) return;
        setMe(data);
      } catch (err) {
        if (!alive) return;

        if (isAuthExpiredError(err)) {
          logout();
        } else if (isNetworkLikeError(err)) {
          setMe(null);
        } else {
          setMe(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadMe();

    return () => {
      alive = false;
    };
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      me,
      loading,
      isAuthed,
      setAuthToken,
      login,
      register,
      logout,
      refreshMe,
      deleteAccount,
    }),
    [token, me, loading, isAuthed, setAuthToken, login, register, logout, refreshMe, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}