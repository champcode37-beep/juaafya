# Debug: Pending Clinics Not Showing

## Issue
Super Admin dashboard shows 4 clinics loaded, but 0 pending clinics found.

## Root Cause Analysis

The logs show:
- ✅ Clinics are loading (4 clinics found)
- ✅ Super Admin can access clinics (no RLS errors)
- ❌ No clinics with `status = 'pending'` are being found

This means either:
1. The clinics in the database don't have `status = 'pending'` (they might be 'active' or something else)
2. The status filtering logic isn't matching correctly

---

## Step 1: Check Database Statuses

Run this query in Supabase SQL Editor:

```sql
-- Check what statuses clinics actually have
SELECT 
  id,
  name,
  status,
  LOWER(status) as status_lowercase,
  created_at
FROM public.clinics
ORDER BY created_at DESC;
```

**Expected**: Should see clinics with `status = 'pending'` (lowercase in DB)

**If you see**:
- All clinics have `status = 'active'` → They were approved or created differently
- All clinics have `status = 'Pending'` (capitalized) → Status was set incorrectly
- Mixed statuses → Some might be pending

---

## Step 2: Check Console Logs

After refreshing the Super Admin dashboard, check the browser console for:

```
[SuperAdminDashboard] Clinic check: {name: "...", status: "...", ...}
```

This will show:
- `status`: The mapped status (Active/Pending/Suspended)
- `statusLower`: Lowercase version
- `rawStatus`: The actual database status
- `rawStatusLower`: Lowercase raw status
- `isPending`: Whether it matched as pending

**Look for**: What are the actual `rawStatus` values?

---

## Step 3: Check Recent Signups

Run this query to see if recent signups created pending clinics:

```sql
-- Check recent signups (last 7 days)
SELECT 
  c.id,
  c.name,
  c.status,
  c.created_at,
  u.email,
  u.full_name
FROM public.clinics c
LEFT JOIN public.users u ON c.owner_id = u.id
WHERE c.created_at > NOW() - INTERVAL '7 days'
ORDER BY c.created_at DESC;
```

**Expected**: Recent signups should have `status = 'pending'`

**If they don't**:
- Trigger might not be working
- Trigger might not be applied
- Status might be set to something else

---

## Step 4: Verify Trigger is Working

Run this to check if trigger exists:

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE WHEN tgenabled = 'O' THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected**: Should show `on_auth_user_created` on `auth.users` as `Enabled`

**If trigger doesn't exist**:
- Run migration: `20260113000010_complete_system_fix.sql`

---

## Step 5: Test Signup

1. Sign up a new clinic
2. Check if it creates with `status = 'pending'`
3. Check if it appears in Super Admin approvals

**If signup doesn't create pending clinic**:
- Trigger is not working
- Check Supabase logs for trigger errors
- Verify trigger function exists

---

## Quick Fixes

### Fix 1: If Clinics Have Wrong Status

If clinics exist but have wrong status, update them:

```sql
-- Update all clinics to pending (if they should be pending)
UPDATE public.clinics 
SET status = 'pending' 
WHERE status != 'pending' 
  AND created_at > NOW() - INTERVAL '30 days';
```

**⚠️ Only run this if you want to reset recent clinics to pending!**

### Fix 2: If Trigger Not Working

1. Apply migration: `20260113000010_complete_system_fix.sql`
2. Verify trigger exists (query above)
3. Test signup again

### Fix 3: If Status Filtering Issue

The code now checks both:
- `status` (mapped: Active/Pending/Suspended)
- `rawStatus` (from database)

Both are checked case-insensitively, so it should work.

---

## Expected Behavior After Fix

1. ✅ New signups create clinics with `status = 'pending'` (lowercase in DB)
2. ✅ `getAllClinics()` maps `'pending'` → `'Pending'` (for UI)
3. ✅ Filter checks `status.toLowerCase() === 'pending'` → matches
4. ✅ Pending clinics appear in "Approvals" tab

---

## Next Steps

1. **Run diagnostic query** to see actual statuses
2. **Check console logs** to see what statuses are being checked
3. **Verify trigger** is working (if recent signups don't create pending clinics)
4. **Test signup** to see if new clinics are created with pending status

---

## Diagnostic Script

I've created a diagnostic script: `supabase/migrations/20260113000011_check_clinic_statuses.sql`

Run this to see:
- All clinics and their statuses
- Status count breakdown
- Pending clinics (case-insensitive)
- Recent signups

---

**After running diagnostics, share the results and I can help fix the specific issue!**
