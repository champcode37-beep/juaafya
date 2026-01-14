# Fix: RLS Infinite Recursion & Premature User Fetching

## Problems Identified

### 1. Infinite Recursion in RLS Policy ❌
**Error**: `infinite recursion detected in policy for relation "users"`

**Root Cause**: The RLS policy on `users` table was querying the `users` table directly, creating a circular dependency:
```sql
-- BAD: This causes recursion
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users  -- ❌ Queries users table, triggers same policy!
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

**Solution**: Use SECURITY DEFINER functions that bypass RLS:
```sql
-- GOOD: Uses function that bypasses RLS
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT
  USING (public.is_super_admin());  -- ✅ Function bypasses RLS
```

### 2. Premature User Fetching ❌
**Problem**: App was trying to fetch user profile data before login, causing unnecessary API calls.

**Root Cause**: The `useEnterpriseAuth` hook was calling `refresh()` even when there was no session.

**Solution**: Only fetch user data when there's actually a session.

## Fix Steps

### Step 1: Apply RLS Recursion Fix (CRITICAL)

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy **entire contents** of `supabase/migrations/20260113000007_fix_rls_recursion_complete.sql`
3. Paste and **Run**

This will:
- Create/update SECURITY DEFINER functions that bypass RLS
- Fix all RLS policies to use these functions (no recursion)
- Ensure Super Admin can read all users and clinics

### Step 2: Verify the Fix

After applying the migration, the app should:
- ✅ Load without infinite recursion errors
- ✅ Only fetch user data when logged in
- ✅ Allow Super Admin to see all clinics

### Step 3: Test

1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)
2. **Open the app** - should load without errors
3. **Try logging in** - should work normally
4. **Check browser console** - should see no recursion errors

## What Was Fixed

### Code Changes

1. ✅ **`supabase/migrations/20260113000007_fix_rls_recursion_complete.sql`**
   - Creates SECURITY DEFINER functions
   - Fixes all RLS policies to use functions (no recursion)

2. ✅ **`hooks/useEnterpriseAuth.ts`**
   - Only fetches user data when session exists
   - Better handling of INITIAL_SESSION event
   - Uses cached user when available

3. ✅ **`supabase/migrations/20260113000006_fix_super_admin_clinic_access.sql`**
   - Updated to use SECURITY DEFINER function (no recursion)

## Technical Details

### SECURITY DEFINER Functions

These functions run with the privileges of the function owner (postgres), bypassing RLS:

- `public.is_super_admin()` - Checks if user is super admin
- `public.get_user_clinic_id()` - Gets user's clinic ID
- `public.is_admin_or_super_admin()` - Checks if user is admin or super admin

### Why This Works

1. **SECURITY DEFINER** functions run with elevated privileges
2. They bypass RLS when querying tables
3. RLS policies can safely call these functions without recursion
4. The functions themselves query `users` table, but since they're SECURITY DEFINER, they don't trigger RLS

## Verification

After applying the fix, verify:

```sql
-- Check functions exist and are SECURITY DEFINER
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('is_super_admin', 'get_user_clinic_id', 'is_admin_or_super_admin');

-- Should show prosecdef = true for all

-- Check policies use functions (not direct queries)
SELECT policyname, qual 
FROM pg_policies 
WHERE tablename = 'users' 
  AND policyname LIKE '%super%admin%';

-- Should show qual using the function, not direct SELECT
```

## If Still Having Issues

1. **Check Supabase Logs** for any remaining errors
2. **Verify functions exist**: Run the verification query above
3. **Check browser console** for any new errors
4. **Try logging out and back in** to clear any cached state

## Files Modified

1. ✅ `supabase/migrations/20260113000007_fix_rls_recursion_complete.sql` - Complete RLS fix
2. ✅ `supabase/migrations/20260113000006_fix_super_admin_clinic_access.sql` - Updated to use functions
3. ✅ `hooks/useEnterpriseAuth.ts` - Fixed premature fetching
