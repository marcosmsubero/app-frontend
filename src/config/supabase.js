const ENV_SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const ENV_SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || ""
).trim();

export const SUPABASE_URL = ENV_SUPABASE_URL;
export const SUPABASE_ANON_KEY = ENV_SUPABASE_ANON_KEY;

export const SUPABASE_AVATARS_BUCKET = String(
  import.meta.env.VITE_SUPABASE_AVATARS_BUCKET || "avatar"
).trim();

export const hasSupabasePublicConfig = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);
