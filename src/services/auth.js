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

export async function upsertSupabaseProfile(user, extra = {}) {
  const client = ensureSupabase();

  if (!user?.id) return null;

  const payload = {
    id: user.id,
    email: user.email ?? null,
    ...extra,
  };

  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSupabaseProfile(userId) {
  const client = ensureSupabase();

  if (!userId) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data;
}
