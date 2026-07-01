import { createClient } from "@supabase/supabase-js"

export function createClientDirect() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim()

  console.log("🔍 RAW SUPABASE_URL:", JSON.stringify(supabaseUrl))
  console.log("🔍 RAW SUPABASE_ANON_KEY:", JSON.stringify(supabaseAnonKey))

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http")) {
    throw new Error("❌ Supabase environment variables are missing or invalid.")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
