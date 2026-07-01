import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  // 🔍 Debug logs
  console.log("🔍 RAW SUPABASE_URL:", JSON.stringify(supabaseUrl))
  console.log("🔍 RAW SUPABASE_ANON_KEY:", JSON.stringify(supabaseAnonKey))

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.error("❌ CRITICAL: Supabase Environment Variables are missing on Vercel's Server Side!")
    return createServerClient('https://placeholder-url-for-builds.supabase.co', 'placeholder', {
      cookies: {
        get() {
          return null
        },
        set() {
          // no-op
        },
        remove() {
          // no-op
        }

      }

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
          } catch {
            // Server Components sometimes throw when attempting to set cookies during render layout
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name: name, value: '', ...options })
          } catch {
            // Handle edge case middleware overrides
          }
        },
      },
    }
  )
}
