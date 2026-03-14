import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { apiMeProfile, apiDeleteMe } from "../services/api";
import {
  getSupabaseSession,
  getSupabaseProfile,
  onSupabaseAuthStateChange,
  signInWithSupabase,
  signOutWithSupabase,
  signUpWithSupabase,
  upsertSupabaseProfile,
} from "../services/auth";

const AuthContext = createContext(null);

function isAuthExpiredError(err) {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("sesión expirada") || msg.includes("401") || msg.includes("unauthorized");
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token ?? null;
  const user = session?.user ?? null;
  const isAuthed = !!session && !!me;

  const logout = useCallback(async () => {
    try {
      await signOutWithSupabase();
    } finally {
      setSession(null);
      setMe(null);
      setProfile(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await apiMeProfile();
    setMe(data);
    return data;
  }, []);

  const refreshProfile = useCallback(async (supabaseUserId) => {
    if (!supabaseUserId) {
      setProfile(null);
      return null;
    }

    const data = await getSupabaseProfile(supabaseUserId);
    setProfile(data);
    return data;
  }, []);

  const hydrateSession = useCallback(
    async (incomingSession) => {
      if (!incomingSession?.user) {
        setSession(null);
        setMe(null);
        setProfile(null);
        setLoading(false);
        return;
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
        } else {
          setMe(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [logout, refreshMe, refreshProfile]
  );

  const login = useCallback(
    async (email, password) => {
      if (!email || !password) throw new Error("Introduce email y contraseña");

      const data = await signInWithSupabase(email, password);
      const nextSession = data?.session ?? null;

      if (!nextSession) {
        throw new Error("No se pudo crear la sesión");
      }

      await hydrateSession(nextSession);
      return nextSession;
    },
    [hydrateSession]
  );

  const register = useCallback(
    async (email, password) => {
      if (!email || !password) throw new Error("Introduce email y contraseña");

      const data = await signUpWith(email, password);

      const User = data?.user ?? null;
      const nextSession = data?.session ?? null;

      if (supabaseUser && nextSession) {
        await upsertSupabaseProfile(supabaseUser, { email });
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
    },
    [hydrateSession]
  );

  const deleteAccount = useCallback(async () => {
    if (!token) throw new Error("No hay sesión activa");
    await apiDeleteMe(token);
    await logout();
    return true;
  }, [token, logout]);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        const currentSession = await getSupabaseSession();
        if (!alive) return;
        await hydrateSession(currentSession);
      } catch {
        if (!alive) return;
        setSession(null);
        setMe(null);
        setProfile(null);
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
  }, [hydrateSession]);

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
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
