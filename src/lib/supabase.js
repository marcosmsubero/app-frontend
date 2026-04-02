import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_AVATARS_BUCKET,
  SUPABASE_URL,
  hasSupabasePublicConfig,
} from "../config/supabase";

export const supabaseUrl = SUPABASE_URL;
export const supabaseAnonKey = SUPABASE_ANON_KEY;
export const supabaseAvatarsBucket = SUPABASE_AVATARS_BUCKET;

export const hasSupabaseEnv = hasSupabasePublicConfig;

export const supabaseConfigError = hasSupabaseEnv
  ? ""
  : "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en las variables de entorno.";

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
