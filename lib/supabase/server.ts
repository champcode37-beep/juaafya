/**
 * Server-side Supabase client using HttpOnly cookies
 * 
 * This client is designed for:
 * - API routes that need to handle auth
 * - Server components that need user context
 * - Secure token storage in HttpOnly cookies
 * 
 * Note: Requires Next.js or Vite with server-side rendering capability
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// For Next.js environments
let cookies: any = null
try {
  // @ts-ignore
  const { cookies: nextCookies } = require('next/headers')
  cookies = nextCookies
} catch (e) {
  // Not in Next.js environment, will be set per-request
}

/**
 * Create a Supabase server client
 * Works with Next.js middleware, API routes, and server components
 */
export function createServerClient() {
  if (!cookies) {
    console.warn('Server client created outside Next.js context')
  }

  const cookieStore = cookies?.() || null

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          if (!cookieStore) return []
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieOptions[]) {
          if (!cookieStore) return
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}

/**
 * Get the current user from server context
 * Uses HttpOnly cookies for authentication
 */
export async function getServerUser() {
  try {
    const supabase = createServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting server user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Failed to get server user:', error)
    return null
  }
}

/**
 * Get the current user's clinic from server context
 */
export async function getServerUserClinic() {
  try {
    const user = await getServerUser()
    if (!user) return null

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error getting clinic:', error)
      return null
    }

    return data?.clinic_id
  } catch (error) {
    console.error('Failed to get server user clinic:', error)
    return null
  }
}

/**
 * Verify that the user is authenticated
 * Returns the user or throws an error
 */
export async function requireAuth() {
  const user = await getServerUser()
  if (!user) {
    throw new Error('Unauthorized: No authenticated user')
  }
  return user
}
