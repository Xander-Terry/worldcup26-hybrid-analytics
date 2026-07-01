/**
 * Server-only Supabase client.
 * Uses the service role key — bypasses RLS, cookies, and SSR complexity.
 * Safe to use in Server Components and Server Actions because this file
 * is never imported by any client component.
 * 
 * NEXT_PUBLIC_SUPABASE_URL    — available in both server + client contexts
 * SUPABASE_SERVICE_ROLE_KEY   — server only, never exposed to browser
 */
import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase env vars. " +
    "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
    "are set in Vercel environment variables."
  )
}

// Singleton — reused across all server action calls in the same request
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    false,
    autoRefreshToken:  false,
    detectSessionInUrl:false,
  },
})