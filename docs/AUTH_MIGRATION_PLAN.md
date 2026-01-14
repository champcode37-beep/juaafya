# 🔐 Authentication Migration Plan: localStorage → HttpOnly Cookies

**Status:** PLANNING  
**Priority:** CRITICAL (Security Vulnerability)  
**Target Completion:** 2-3 weeks

---

## Overview

### Current Vulnerability
- ❌ Refresh tokens stored in browser `localStorage`
- ❌ Accessible to JavaScript (XSS risk)
- ❌ Contradicts security documentation

### Target State
- ✅ Tokens stored in HttpOnly secure cookies
- ✅ Not accessible to JavaScript
- ✅ Automatic CSRF protection
- ✅ Server-side session management

---

## Architecture Comparison

### Current Architecture
```
Browser localStorage
    ↓
SafeStorage adapter
    ↓
Supabase Client (autoRefreshToken)
    ↓
Protected by RLS only
```

### Target Architecture
```
HttpOnly Secure Cookies
    ↓
Server-side middleware
    ↓
Supabase SSR Client
    ↓
Protected by RLS + Cookie isolation
```

---

## Implementation Strategy

### Phase 1: Prepare Server-Side Infrastructure (Week 1)

#### Step 1.1: Create Session Middleware
**File:** `lib/supabase/middleware.ts` (enhance existing)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return supabaseResponse
}
```

#### Step 1.2: Create Auth API Route
**File:** `pages/api/auth/[...auth].ts`

This route handles:
- Sign-in callback (stores tokens in HttpOnly cookies)
- Sign-out (clears cookies)
- Token refresh

---

### Phase 2: Update Auth Context (Week 1-2)

#### Step 2.1: Modify `lib/auth-context.tsx`
Replace `getSupabase()` client with server-side client creation:

```typescript
// Before: Uses SafeStorage localStorage
const supabase = getSupabase()  // ❌ Old way

// After: Uses server-side SSR client
const supabase = createServerClient(...)  // ✅ New way
```

#### Step 2.2: Update Sign-In Flow
```typescript
async function signIn(email: string, password: string) {
  // Call server-side auth API
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.ok) {
    // Cookies set automatically by server
    // Redirect to dashboard
    navigate('/dashboard')
  }
}
```

---

### Phase 3: Deprecate localStorage (Week 2)

#### Step 3.1: Add Cookie Fallback
```typescript
export function getSafeSession() {
  try {
    // Try new cookie-based session first
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    // Fallback to localStorage migration if needed
    const stored = localStorage.getItem('auth-migration')
    if (stored) {
      // Migrate old token to new cookie-based auth
      return migrateFromLocalStorage(stored)
    }
  }
}
```

#### Step 3.2: Add Migration Banner
Show users a message encouraging them to re-login to use new secure session:
```typescript
if (hasOldLocalStorageToken && !hasCookie) {
  showToast('Your security has been enhanced. Please log in again.', 'info')
  navigateToLogin()
}
```

---

### Phase 4: Testing & Validation (Week 2-3)

#### Security Tests
- [ ] Verify tokens NOT in localStorage
- [ ] Verify cookies are HttpOnly (not accessible to JS)
- [ ] Verify cookies are Secure (HTTPS only)
- [ ] Verify SameSite protection enabled
- [ ] Test refresh token expiry
- [ ] Test session persistence across tabs

#### Browser Tests
```javascript
// In DevTools Console - should be undefined
console.log(localStorage.getItem('sb-auth-token'))  // Should be null
document.cookie  // Should contain sb-* cookies (not accessible to JS)
```

---

## Migration Checklist

### Pre-Migration
- [ ] Backup current auth configuration
- [ ] Create feature branch
- [ ] Document current behavior
- [ ] Plan rollback strategy

### Migration Steps
- [ ] Create server-side session middleware
- [ ] Create auth API routes (signin, signout, callback)
- [ ] Update auth context with SSR client
- [ ] Update sign-in/sign-up flows
- [ ] Add cookie migration logic
- [ ] Remove SafeStorage adapter
- [ ] Test all auth flows

### Post-Migration
- [ ] Monitor error logs for auth issues
- [ ] Verify session persistence
- [ ] Check performance impact
- [ ] Update security documentation
- [ ] Train team on new auth flow

---

## Detailed Implementation: Auth API Routes

### Route: POST /api/auth/signin

```typescript
// pages/api/auth/signin.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }

  // Cookies automatically set by supabase
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

### Route: POST /api/auth/signout

```typescript
// pages/api/auth/signout.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()

  // Cookies automatically cleared by supabase
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
```

---

## Cookie Security Configuration

### HttpOnly Cookie Settings
```typescript
// Cookies will have these properties automatically:
{
  httpOnly: true,      // Not accessible to JavaScript
  secure: true,        // Only sent over HTTPS
  sameSite: 'lax',     // CSRF protection
  path: '/',           // Available site-wide
  maxAge: 3600,        // Session duration
}
```

### Verification
After migration, cookies should appear as:
```
Cookie: sb-<project-id>-auth-token=[encrypted]; HttpOnly; Secure; SameSite=Lax
```

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback:**
   ```bash
   git revert [commit-hash]
   npm run build
   npm run deploy
   ```

2. **User Communication:**
   - Show message: "We're updating security. Please re-login if needed."
   - Monitor error rates
   - Have support team ready

3. **Post-Rollback:**
   - Identify what went wrong
   - Fix in development
   - Test more thoroughly before re-attempting

---

## Timeline

| Phase | Task | Duration | Owner |
|-------|------|----------|-------|
| Phase 1 | Server middleware setup | 2-3 days | Backend |
| Phase 1 | Auth API routes | 2-3 days | Backend |
| Phase 2 | Update auth context | 2-3 days | Frontend |
| Phase 2 | Update sign-in/up flows | 2-3 days | Frontend |
| Phase 3 | Migration & deprecation | 2-3 days | Both |
| Phase 4 | Testing & validation | 3-5 days | QA |
| Phase 4 | Production deployment | 1 day | DevOps |

**Total: 14-18 days (2-3 weeks)**

---

## Success Criteria

✅ **Migration is successful when:**
- All users' tokens are in HttpOnly cookies
- No tokens in localStorage
- All auth flows work correctly
- Session persists across browser tabs
- Token refresh works seamlessly
- No security warnings from audits
- User experience unchanged

---

## Documentation Updates

After migration, update:
1. `docs/SECURITY_KEYS_AUDIT.md` - Update token storage section
2. `docs/SYSTEM_AUDIT_REPORT.md` - Mark Issue #1 as resolved
3. `README.md` - Update auth flow documentation
4. `docs/API.md` - Document new auth endpoints

---

## Next Steps

1. **Review this plan** with security team
2. **Estimate effort** accurately
3. **Schedule implementation** 
4. **Create feature branch** for development
5. **Begin Phase 1** implementation

---

**Plan Created:** January 2026  
**Status:** Ready for approval  
**Risk Level:** Medium (affects core auth, requires careful testing)
