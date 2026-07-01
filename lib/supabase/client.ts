import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  // Safe fallback to prevent the app from throwing a cryptic, un-loggable error
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.error("❌ CRITICAL: Supabase Environment Variables are missing on Vercel's Server Side!")
    // Returns a dummy client layout so the page rendering engine doesn't snap
    return createServerClient('https://placeholder-url-for-builds.supabase.co', 'placeholder', {
      cookies: { get() {}, set() {}, remove() {} }
    })
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Components sometimes throw when attempting to set cookies during render layout
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name: name, value: '', ...options })
          } catch (error) {
            // Handle edge case middleware overrides
          }
        },
      },
    }
  )
}