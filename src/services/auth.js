import { hasSupabaseEnv, supabase, supabaseConfigError } from "../lib/supabase";

function ensureSupabase() {
  if (!hasSupabaseEnv || !supabase) {
    throw new Error(
      supabaseConfigError ||
        "La configuración pública de Supabase no está disponible."
    );
  }

  return supabase;
}

export async function signUpWithSupabase(email, password) {
  const client = ensureSupabase();

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithSupabase(email, password) {
  const client = ensureSupabase();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function signOutWithSupabase() {
  const client = ensureSupabase();

  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPasswordForEmail(email) {
  const client = ensureSupabase();

  // Use the app's base URL (before the hash) as redirect target.
  // Supabase will redirect here with auth tokens; the JS client picks them up
  // and fires PASSWORD_RECOVERY, which App.jsx handles by navigating to /reset-password.
  const base = window.location.origin + window.location.pathname.replace(/\/index\.html$/i, "/");
  const redirectTo = base.endsWith("/") ? base : base + "/";

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) throw new Error(error.message);
}

export async function updateSupabasePassword(newPassword) {
  const client = ensureSupabase();

  const { data, error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function getSupabaseSession() {
  const client = ensureSupabase();

  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session ?? null;
}

export function onSupabaseAuthStateChange(callback) {
  if (!hasSupabaseEnv || !supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
