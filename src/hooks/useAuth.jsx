import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiDeleteMe, apiMeProfile } from "../services/api";
import {
  getSupabaseProfile,
  getSupabaseSession,
  onSupabaseAuthStateChange,
  signInWithSupabase,
  signOutWithSupabase,
  signUpWithSupabase,
  upsertSupabaseProfile,
} from "../services/auth";

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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token ?? null;
  const user = session?.user ?? null;
  const isAuthed = !!session;

  const clearAuthState = useCallback(() => {
    setSession(null);
    setMe(null);
    setProfile(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutWithSupabase();
    } catch {
      // ignore
    } finally {
      clearAuthState();
      setLoading(false);
    }
  }, [clearAuthState]);

  const refreshMe = useCallback(async () => {
    try {
      const data = await apiMeProfile();
      setMe(data);
      return data;
    } catch (err) {
      if (isAuthExpiredError(err)) {
        throw err;
      }
      setMe(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (supabaseUserId) => {
    if (!supabaseUserId) {
      setProfile(null);
      return null;
    }

    try {
      const data = await getSupabaseProfile(supabaseUserId);
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const hydrateSession = useCallback(
    async (incomingSession) => {
      if (!incomingSession?.user) {
        clearAuthState();
        setLoading(false);
        return null;
      }

      setSession(incomingSession);

      try {
        await Promise.all([
          refreshMe(),
          refreshProfile(incomingSession.user.id),
        ]);
      } catch (err) {
        if (isAuthExpiredError(err)) {
          await logout();
          return null;
        }
      } finally {
        setLoading(false);
      }

      return incomingSession;
    },
    [clearAuthState, logout, refreshMe, refreshProfile]
  );

  const login = useCallback(
    async (email, password) => {
      if (!email || !password) {
        throw new Error("Introduce email y contraseña");
      }

      setLoading(true);

      try {
        const data = await signInWithSupabase(email, password);
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

        if (supabaseUser && nextSession) {
          try {
            await upsertSupabaseProfile(supabaseUser, { email });
          } catch {
            // no bloquear registro si profiles falla
          }
        }

        if (nextSession) {
          await hydrateSession(nextSession);
        } else {
          setLoading(false);
        }

        return {
          user: supabaseUser,
          session: nextSession,
          needsEmailConfirmation: !nextSession,
        };
      } finally {
        setLoading(false);
      }
    },
    [hydrateSession]
  );

  const ensureProfile = useCallback(async () => {
    if (!session?.user) return null;

    const existing = await refreshProfile(session.user.id);
    if (existing) return existing;

    try {
      const created = await upsertSupabaseProfile(session.user, {
        email: session.user.email ?? null,
      });
      setProfile(created);
      return created;
    } catch {
      return null;
    }
  }, [refreshProfile, session]);

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
      profile,
      loading,
      isAuthed,
      login,
      register,
      logout,
      refreshMe,
      refreshProfile,
      ensureProfile,
      deleteAccount,
    }),
    [
      token,
      session,
      user,
      me,
      profile,
      loading,
      isAuthed,
      login,
      register,
      logout,
      refreshMe,
      refreshProfile,
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
