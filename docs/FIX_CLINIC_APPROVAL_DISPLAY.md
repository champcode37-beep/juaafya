# Fix: Clinics Not Appearing in Super Admin Portal

## Problem
Clinics are being created successfully during signup, but they don't appear in:
- Super Admin "Approvals" section
- Super Admin "Clinics" section

## Root Causes Identified

### 1. Role Matching Issue (FIXED)
**Location**: `services/db.ts` line 588

**Problem**: Code was checking for `'Admin'` or `'SuperAdmin'` (capitalized), but database stores `'admin'` or `'super_admin'` (lowercase).

**Fix Applied**: Updated to check for both formats.

### 2. RLS Policy Issue (NEEDS FIX)
**Problem**: Super Admin might not have proper RLS policies to:
- Read all clinics
- Read all users (needed for the join in `getAllClinics`)

## Solution Steps

### Step 1: Apply RLS Fix Migration
Run this in Supabase SQL Editor:

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy **entire contents** of `supabase/migrations/20260113000006_fix_super_admin_clinic_access.sql`
3. Paste and **Run**

This will:
- Ensure Super Admin can read all users (needed for the join)
- Ensure Super Admin can read all clinics
- Fix the `is_super_admin()` function

### Step 2: Verify Data Was Created
Run this diagnostic:

1. In SQL Editor, copy **entire contents** of `supabase/migrations/20260113000005_check_clinic_data.sql`
2. Paste and **Run**
3. Check the results:
   - Are clinics being created?
   - Are user profiles being created?
   - What status do they have?

### Step 3: Test the Query
After applying the RLS fix, test if Super Admin can see clinics:

```sql
-- Run this as the Super Admin user (or check if it works)
SELECT 
  c.id,
  c.name,
  c.status,
  c.email,
  json_agg(json_build_object('full_name', u.full_name, 'role', u.role)) as users
FROM public.clinics c
LEFT JOIN public.users u ON u.clinic_id = c.id
GROUP BY c.id, c.name, c.status, c.email
ORDER BY c.created_at DESC;
```

## Expected Behavior After Fix

1. **Signup creates**:
   - Auth user in `auth.users`
   - Clinic in `public.clinics` with `status = 'pending'`
   - User profile in `public.users` with `role = 'admin'`

2. **Super Admin Dashboard**:
   - `getAllClinics()` returns all clinics including pending ones
   - Status mapping converts `'pending'` → `'Pending'`
   - Pending clinics appear in "Approvals" tab
   - All clinics appear in "Clinics" tab

3. **Status Flow**:
   - New signup: `status = 'pending'` (lowercase in DB)
   - Display: `status = 'Pending'` (capitalized in UI)
   - After approval: `status = 'active'` → `'Active'`

## Verification Checklist

After applying fixes:

- [ ] RLS migration applied successfully
- [ ] Diagnostic shows clinics were created
- [ ] Diagnostic shows user profiles were created
- [ ] Super Admin can see clinics in dashboard
- [ ] Pending clinics appear in "Approvals" tab
- [ ] All clinics appear in "Clinics" tab

## If Still Not Working

1. **Check browser console** for errors when loading Super Admin dashboard
2. **Check Supabase logs** for RLS policy violations
3. **Verify Super Admin user** has `role = 'super_admin'` in `public.users` table
4. **Run the diagnostic script** to see what data exists

## Files Modified

1. ✅ `services/db.ts` - Fixed role matching (line 588)
2. ⏳ `supabase/migrations/20260113000006_fix_super_admin_clinic_access.sql` - RLS policies (needs to be applied)

## Next Steps

1. Apply the RLS fix migration
2. Refresh the Super Admin dashboard
3. Check if clinics now appear
4. If not, run the diagnostic script and share results
