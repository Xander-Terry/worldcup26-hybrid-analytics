import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  // Trim hidden whitespace/newlines from Vercel env vars
  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim()

  // Debug logs (now safe)
  console.log("🔍 RAW SUPABASE_URL:", JSON.stringify(supabaseUrl))
  console.log("🔍 RAW SUPABASE_ANON_KEY:", JSON.stringify(supabaseAnonKey))

  // If env vars are missing or malformed, STOP — do NOT create a fallback client
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    throw new Error("❌ Supabase environment variables are missing or invalid.")
  }

  // Valid Supabase client inside request scope
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value ?? null
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // ignore SSR cookie write errors
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // ignore SSR cookie write errors
          }
        },
      },
    }
  )
}
