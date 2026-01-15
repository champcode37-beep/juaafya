# Netlify Secret Exposure Fix - Summary

**Date:** January 15, 2026  
**Issue:** Netlify build failing due to detected secrets in compiled JavaScript bundle

---

## Problem

Netlify's secret scanner detected the following environment variables being hardcoded into the production JavaScript bundle:

- `VITE_GEMINI_API_KEY` - AI API key
- `VITE_MOBIWAVE_API_TOKEN` - SMS API token  
- `VITE_SUPABASE_URL` - Database URL
- `VITE_SUPABASE_ANON_KEY` - Database anonymous key
- `NEXT_PUBLIC_SUPABASE_URL` - Database URL (Next.js variant)

**Root Cause:** Vite's `define` configuration was injecting these values as string literals directly into the compiled code, making them visible in the production bundle.

---

## Solution Implemented

### 1. **Removed Sensitive Keys from Client Bundle**

#### `vite.config.ts`
- ✅ Removed `VITE_GEMINI_API_KEY` from the `define` block
- ✅ Gemini API calls already routed through Supabase Edge Function (`gemini-chat`)

#### `services/mobiwaveService.ts`
- ✅ Removed hardcoded `VITE_MOBIWAVE_API_TOKEN`
- ✅ Refactored all Mobiwave API calls to use Supabase Edge Function proxy
- ✅ Created `callMobiwaveEdgeFunction()` helper

### 2. **Created Mobiwave Edge Function Proxy**

**File:** `supabase/functions/mobiwave-proxy/index.ts`

This edge function:
- Securely stores `VITE_MOBIWAVE_API_TOKEN` server-side
- Proxies all Mobiwave API calls (SMS, contacts, groups)
- Prevents token exposure in client code

**To Deploy:**
```bash
supabase functions deploy mobiwave-proxy
supabase secrets set VITE_MOBIWAVE_API_TOKEN=your_token_here
```

### 3. **Configured Netlify Secret Scanning**

#### `netlify.toml`
Added configuration to allow Supabase public keys (which are safe to expose):

```toml
[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

**Why this is safe:**
- Supabase URL and Anon Key are **designed to be public**
- All data access is protected by Row-Level Security (RLS) policies
- Anonymous key has no write permissions without authentication
- This is standard practice for Supabase applications

---

## Security Architecture

### ✅ Public Keys (Safe in Client)
- `VITE_SUPABASE_URL` - Public database URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous key (RLS-protected)

### 🔒 Secret Keys (Server-Only via Edge Functions)
- `VITE_GEMINI_API_KEY` - AI API key → `gemini-chat` edge function
- `VITE_MOBIWAVE_API_TOKEN` - SMS API token → `mobiwave-proxy` edge function
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key → Edge functions only

---

## Deployment Checklist

### Netlify Environment Variables
Set these in **Netlify Dashboard → Site Settings → Environment Variables**:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Edge Function Secrets
Set these in **Supabase Dashboard → Edge Functions → Secrets**:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set VITE_MOBIWAVE_API_TOKEN=your_mobiwave_token
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Deploy Edge Functions
```bash
# Deploy Mobiwave proxy
supabase functions deploy mobiwave-proxy

# Verify Gemini chat is deployed
supabase functions deploy gemini-chat
```

---

## Files Modified

1. ✅ `netlify.toml` - Added secret scanning configuration
2. ✅ `vite.config.ts` - Removed GEMINI_API_KEY from client bundle
3. ✅ `services/mobiwaveService.ts` - Refactored to use edge function proxy
4. ✅ `supabase/functions/mobiwave-proxy/index.ts` - Created new edge function
5. ✅ `docs/FIX_MISSING_CLINIC_REGISTRATIONS.md` - Sanitized Supabase URLs
6. ✅ `docs/FIX_SIGNUP_500_STEP_BY_STEP.md` - Sanitized Supabase URLs
7. ✅ `docs/SUPABASE_DATABASE_SETUP.md` - Sanitized Supabase URLs
8. ✅ `docs/TROUBLESHOOTING_SIGNUP_500_ERROR.md` - Sanitized Supabase URLs

---

## Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Deploy functions locally
supabase functions serve

# Test Mobiwave proxy
curl -X POST http://localhost:54321/functions/v1/mobiwave-proxy \
  -H "Content-Type: application/json" \
  -d '{"action":"getGroups"}'
```

### Production Testing
1. Push changes to GitHub
2. Netlify will automatically rebuild
3. Verify build passes secret scanning
4. Test SMS functionality in production

---

## Expected Build Output

✅ **Before Fix:**
```
Secrets scanning found secrets in build.
- VITE_GEMINI_API_KEY
- VITE_MOBIWAVE_API_TOKEN
Build failed
```

✅ **After Fix:**
```
Scanning for secrets in code and build output.
Scanning complete. 0 secrets found.
Build succeeded
```

---

## Migration Notes

### Breaking Changes
**Mobiwave Service** now requires the `mobiwave-proxy` edge function to be deployed.

If you see errors like:
```
Error: FunctionsHttpError: Edge Function returned non-2xx status code
```

**Solution:**
1. Deploy the edge function: `supabase functions deploy mobiwave-proxy`
2. Set the secret: `supabase secrets set VITE_MOBIWAVE_API_TOKEN=your_token`

### Backward Compatibility
The `mobiwaveService` API remains unchanged - all existing code calling `mobiwaveService.sendSMS()` etc. will continue to work without modifications.

---

## Security Best Practices

✅ **Implemented:**
- Sensitive API keys stored server-side only
- Public keys explicitly allowed in Netlify config
- All API calls proxied through edge functions
- Documentation sanitized of real credentials

🔄 **Recommended Next Steps:**
1. Rotate all exposed API keys (Gemini, Mobiwave)
2. Enable Supabase audit logging
3. Set up secret rotation schedule (every 90 days)
4. Add pre-commit hooks to prevent future secret commits

---

## Support

If the build still fails:

1. **Check Netlify Build Logs** for specific error messages
2. **Verify Environment Variables** are set in Netlify dashboard
3. **Confirm Edge Functions** are deployed to Supabase
4. **Test Edge Functions** using Supabase dashboard

---

**Status:** ✅ Ready for deployment  
**Next Action:** Push to GitHub and monitor Netlify build
