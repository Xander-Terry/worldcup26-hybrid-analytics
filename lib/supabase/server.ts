import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Safety guard to prevent Vercel environment blank crashes
if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
  console.error("❌ CRITICAL: Supabase Environment Variables are missing on Vercel's Server Side!")
}

export const supabase = createServerClient(
  supabaseUrl || 'https://placeholder-url-for-builds.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    cookies: {
      get(name) {
        const cookieStore = cookies()
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        const cookieStore = cookies()
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Handled for server component rendering phases
        }
      },
      remove(name, options) {
        const cookieStore = cookies()
        try {
          cookieStore.set({ name: name, value: '', ...options })
        } catch {
          // Handled for server component rendering phases
        }
      },
    },
  }
)