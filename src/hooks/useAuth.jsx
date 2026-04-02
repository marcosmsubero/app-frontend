import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiDeleteMe, apiMeProfile, apiResolveHandle } from "../services/api";
import {
  getSupabaseSession,
  onSupabaseAuthStateChange,
  signInWithSupabase,
  signOutWithSupabase,
  signUpWithSupabase,
} from "../services/auth";
import {
  getPreferredLoginIdentifier,
  normalizeUserContract,
} from "../lib/userContract";

const AuthContext = createContext(null);

function isAuthExpiredError(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("sesión expirada") ||
    msg.includes("session expired") ||
    msg.includes("401") ||
    msg.includes("unauthorized")
  );
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meReady, setMeReady] = useState(false);
  const [meError, setMeError] = useState("");

  const hydrateSeqRef = useRef(0);

  const token = session?.access_token ?? null;
  const user = session?.user ?? null;
  const isAuthed = !!session;

  const clearAuthState = useCallback(() => {
    setSession(null);
    setMe(null);
    setMeReady(false);
    setMeError("");
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutWithSupabase();
    } catch {
      // ignore
    } finally {
      clearAuthState();
      setMeReady(true);
      setLoading(false);
    }
  }, [clearAuthState]);

  const fetchMe = useCallback(async (explicitToken) => {
    try {
      return normalizeUserContract((await apiMeProfile(explicitToken)) || {});
    } catch (err) {
      if (isAuthExpiredError(err)) {
        throw err;
      }
      throw new Error(err?.message || "No se pudo cargar el perfil.");
    }
  }, []);

  const refreshMe = useCallback(
    async (explicitToken) => {
      if (!session?.user && !explicitToken) {
        setMe(null);
        setMeReady(true);
        return null;
      }

      setMeReady(false);
      setMeError("");

      try {
        const nextMe = await fetchMe(explicitToken);
        setMe(nextMe);
        return nextMe;
      } catch (err) {
        if (isAuthExpiredError(err)) {
          throw err;
        }

        setMe(null);
        setMeError(err?.message || "No se pudo cargar el perfil.");
        return null;
      } finally {
        setMeReady(true);
      }
    },
    [fetchMe, session?.user]
  );

  const hydrateSession = useCallback(
    async (incomingSession) => {
      const seq = ++hydrateSeqRef.current;
      setLoading(true);
      setMeReady(false);
      setMeError("");

      if (!incomingSession?.user) {
        clearAuthState();
        setMeReady(true);
        setLoading(false);
        return null;
      }

      setSession(incomingSession);

      try {
        const nextMe = await fetchMe(incomingSession.access_token);

        if (seq !== hydrateSeqRef.current) {
          return incomingSession;
        }

        setMe(nextMe);
        setMeError("");
      } catch (err) {
        if (seq !== hydrateSeqRef.current) {
          return incomingSession;
        }

        if (isAuthExpiredError(err)) {
          await logout();
          return null;
        }

        setMe(null);
        setMeError(err?.message || "No se pudo cargar el perfil.");
      } finally {
        if (seq === hydrateSeqRef.current) {
          setMeReady(true);
          setLoading(false);
        }
      }

      return incomingSession;
    },
    [clearAuthState, fetchMe, logout]
  );

  const login = useCallback(
    async (identifier, password) => {
      if (!identifier || !password) {
        throw new Error("Introduce usuario/email y contraseña");
      }

      setLoading(true);

      try {
        const parsed = getPreferredLoginIdentifier(identifier);

        let emailToUse = null;

        if (parsed.type === "email") {
          emailToUse = parsed.value;
        } else if (parsed.type === "handle") {
          const resolved = await apiResolveHandle(parsed.value);
          emailToUse = resolved?.email ?? null;
        } else {
          throw new Error("Introduce un email o usuario válido");
        }

        if (!emailToUse) {
          throw new Error("No se pudo resolver el usuario");
        }

        const data = await signInWithSupabase(emailToUse, password);
        const nextSession = data?.session ?? null;

        if (!nextSession) {
          throw new Error("No se pudo crear la sesión");
        }

        await hydrateSession(nextSession);
        return nextSession;
      } finally {
        setLoading(false);
      }
    },
    [hydrateSession]
  );

  const register = useCallback(
    async (email, password) => {
      if (!email || !password) {
        throw new Error("Introduce email y contraseña");
      }

      setLoading(true);

      try {
        const data = await signUpWithSupabase(email, password);

        const supabaseUser = data?.user ?? null;
        const nextSession = data?.session ?? null;
        const requiresEmailConfirmation = !nextSession;

        if (!supabaseUser) {
          throw new Error("No se pudo crear la cuenta en Supabase Auth.");
        }

        if (nextSession) {
          await hydrateSession(nextSession);
        } else {
          clearAuthState();
          setMeReady(true);
        }

        return {
          user: supabaseUser,
          session: nextSession,
          requiresEmailConfirmation,
        };
      } finally {
        setLoading(false);
      }
    },
    [clearAuthState, hydrateSession]
  );

  const ensureProfile = useCallback(async () => {
    if (!session?.user) return null;
    return refreshMe(session.access_token);
  }, [refreshMe, session]);

  const deleteAccount = useCallback(async () => {
    if (!token) {
      throw new Error("No hay sesión activa");
    }

    await apiDeleteMe(token);
    await logout();
    return true;
  }, [logout, token]);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        const currentSession = await getSupabaseSession();
        if (!alive) return;
        await hydrateSession(currentSession);
      } catch {
        if (!alive) return;
        clearAuthState();
        setMeReady(true);
        setLoading(false);
      }
    }

    bootstrap();

    const unsubscribe = onSupabaseAuthStateChange(async (nextSession) => {
      if (!alive) return;
      await hydrateSession(nextSession);
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [clearAuthState, hydrateSession]);

  const value = useMemo(
    () => ({
      token,
      session,
      user,
      me,
      profile: null,
      loading,
      meReady,
      meError,
      isAuthed,
      login,
      register,
      logout,
      refreshMe,
      refreshProfile: async () => null,
      ensureProfile,
      deleteAccount,
    }),
    [
      token,
      session,
      user,
      me,
      loading,
      meReady,
      meError,
      isAuthed,
      login,
      register,
      logout,
      refreshMe,
      ensureProfile,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
