import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    // Client-side: log clearly, app will use local fallback
    console.warn('[HotelFlow] Supabase env vars missing — running in offline/local mode.');
  }
}

// Create client with safe fallbacks (app handles missing config gracefully)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseAvailable = !!(supabaseUrl && supabaseAnonKey);
