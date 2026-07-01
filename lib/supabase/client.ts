/**
 * Browser-side Supabase client — used only in Client Components.
 * Uses anon key only. No SSR, no cookies, no auth session.
 */
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession:     false,
      autoRefreshToken:   false,
      detectSessionInUrl: false,
    },
  }
)