import { createClient } from "@supabase/supabase-js"

export function createClientDirect() {
  const supabaseUrl = process.env.SUPABASE_URL!.trim()
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!.trim()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
