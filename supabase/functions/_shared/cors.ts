/**
 * Shared CORS configuration for all Edge Functions
 * Restricts origins to trusted domains only
 */

// Allowed origins - update based on your deployment
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://juaafya.com',
  'https://www.juaafya.com',
  'https://app.juaafya.com',
  'https://admin.juaafya.com',
  'https://juaafya.netlify.app', // Explicitly add specific netlify app
  // Add your Vercel/Netlify preview URLs
  /^https:\/\/.*\.vercel\.app$/, // Vercel preview deployments
  /^https:\/\/.*\.netlify\.app$/, // Netlify preview deployments
]

/**
 * Get CORS headers for the given origin
 * Returns safe headers with origin restriction
 */
export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  let allowedOrigin = '*' // Default to * for safety if not needing credentials, but we do need credentials usually

  if (requestOrigin) {
    // Check if origin matches allowed list
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => {
      if (allowed instanceof RegExp) {
        return allowed.test(requestOrigin)
      }
      return allowed === requestOrigin
    })

    if (isAllowed) {
      allowedOrigin = requestOrigin
    }
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    // Added 'apikey' and 'x-client-info' which are commonly sent by Supabase clients
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-id',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response | null {
  if (request.method !== 'OPTIONS') {
    return null
  }

  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  return new Response('ok', {
    status: 204,
    headers: corsHeaders,
  })
}
