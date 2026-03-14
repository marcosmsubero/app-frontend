import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { apiMeProfile } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = session?.access_token || null;
  const isAuthed = !!session;

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        try {
          const profile = await apiMeProfile(session.access_token);
          if (mounted) setProfile(profile);
        } catch (e) {
          console.error("Error loading profile", e);
        }
      }

      if (mounted) setLoading(false);
    }

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.access_token) {
          try {
            const profile = await apiMeProfile(session.access_token);
            setProfile(profile);
          } catch (e) {
            console.error("Error loading profile", e);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value = {
    session,
    user,
    profile,
    token,
    loading,
    isAuthed,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
