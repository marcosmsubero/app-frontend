const FALLBACK_SUPABASE_URL = "https://rqzearudrxdisnkjjyrc.supabase.co";

const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxemVhcnVkcnhkaXNua2pqeXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODkwMTYsImV4cCI6MjA4OTA2NTAxNn0.oAqDNYiO1PLRYd7vJqS8xKc_bzuKHNW3Bm0o8ox5YFE";

export const SUPABASE_URL = String(
  import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
).trim();

export const SUPABASE_ANON_KEY = String(
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
).trim();

export const SUPABASE_AVATARS_BUCKET = String(
  import.meta.env.VITE_SUPABASE_AVATARS_BUCKET || "avatar"
).trim();

export const hasSupabasePublicConfig = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);
