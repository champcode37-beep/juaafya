# Database Verification Results Guide

## How to Use This Guide

After running the verification script (`20260113000009_verify_database_state.sql`) in Supabase SQL Editor, use this guide to interpret the results.

---

## 1. TRIGGER CHECK ✅

**What to Look For**:
- `trigger_name` should be `on_auth_user_created`
- `table_name` should be `auth.users`
- `is_enabled` should show `✅ Enabled`

**If Trigger is Missing or Disabled**:
- Run the signup trigger migration: `20260110000000_auto_create_clinic_on_signup.sql`
- Verify the trigger is attached to `auth.users` table

**Expected Result**:
```
trigger_name: on_auth_user_created
table_name: auth.users
status: ✅ Enabled
```

---

## 2. FUNCTION CHECK ✅

**What to Look For**:
- `function_name` should be `handle_new_user_signup`
- `security_type` should be `✅ SECURITY DEFINER`

**If Function is Missing or Not SECURITY DEFINER**:
- The trigger won't work correctly
- Run the signup trigger migration again

**Expected Result**:
```
function_name: handle_new_user_signup
security_type: ✅ SECURITY DEFINER
```

---

## 3. CLINICS RLS POLICIES ✅

**What to Look For**:
- Should have policy: `"Super admins can read all clinics"` or similar
- Should have policy for regular users to read their own clinic
- All policies should have `✅ Has USING clause`

**Critical Policies Needed**:
1. **Super Admin Read All**: Allows Super Admin to see all clinics
2. **Users Read Own**: Allows users to see their clinic
3. **System Insert**: Allows trigger to insert clinics (if needed)

**If Policies are Missing**:
- Run migration: `20260113000006_fix_super_admin_clinic_access.sql`
- Or run: `20260113000007_fix_rls_recursion_complete.sql`

**Expected Result**:
```
policyname: Super admins can read all clinics
operation: SELECT
has_using: ✅ Has USING clause
```

---

## 4. USERS RLS POLICIES ✅

**What to Look For**:
- Should have policy: `"Super admins can read all users"` or similar
- Should have policy for users to read their own profile
- All policies should have `✅ Has USING clause`

**Critical Policies Needed**:
1. **Super Admin Read All**: Allows Super Admin to see all users (needed for getAllClinics join)
2. **Users Read Own**: Allows users to see their profile
3. **System Insert**: Allows trigger to insert users (if needed)

**If Policies are Missing**:
- Run migration: `20260113000007_fix_rls_recursion_complete.sql`

**Expected Result**:
```
policyname: Super admins can read all users
operation: SELECT
has_using: ✅ Has USING clause
```

---

## 5. HELPER FUNCTIONS ✅

**What to Look For**:
- All four functions should exist:
  - `is_super_admin`
  - `get_user_clinic_id`
  - `is_admin_or_super_admin`
  - `get_user_role`
- All should show `✅ SECURITY DEFINER`

**If Functions are Missing or Not SECURITY DEFINER**:
- This will cause RLS infinite recursion errors
- Run migration: `20260113000007_fix_rls_recursion_complete.sql`

**Expected Result**:
```
function_name: is_super_admin
security_type: ✅ SECURITY DEFINER
```

---

## 6. PENDING CLINICS ✅

**What to Look For**:
- Should list all clinics with `status = 'pending'` (case-insensitive)
- Each should show `✅ Pending status`
- Should match recent signups

**If No Pending Clinics**:
- Check if signups are creating clinics
- Check if status is being set correctly
- Verify trigger is working

**If Pending Clinics Exist but Don't Show in UI**:
- Check RLS policies (section 3)
- Check `getAllClinics()` function in `services/db.ts`
- Check filtering logic in `SuperAdminDashboard.tsx`

**Expected Result**:
```
status_check: ✅ Pending status
(Should list all pending clinics)
```

---

## 7. CLINIC STATUS COUNT ✅

**What to Look For**:
- Should show breakdown of clinic statuses
- Pending clinics should be marked `✅ Should appear in approvals`
- Active clinics should be marked `✅ Active clinic`

**Expected Result**:
```
status: pending
count: X
note: ✅ Should appear in approvals
```

---

## 8. RECENT SIGNUPS ✅

**What to Look For**:
- Should list all signups from last 24 hours
- Each should show complete signup status:
  - `✅ Complete - Pending approval` (ideal)
  - `❌ No user profile created` (problem)
  - `❌ No clinic created` (problem)

**If Signups are Incomplete**:
- Trigger may not be firing
- Trigger may be failing silently
- Check trigger logs in Supabase

**Expected Result**:
```
signup_status: ✅ Complete - Pending approval
(Should show auth user, profile, and clinic all created)
```

---

## 9. RLS ENABLED CHECK ✅

**What to Look For**:
- All tables should show `✅ RLS Enabled`
- Tables: `clinics`, `users`, `activities`

**If RLS is Disabled**:
- This is a security issue
- Enable RLS: `ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;`
- Then create appropriate policies

**Expected Result**:
```
tablename: clinics
rls_status: ✅ RLS Enabled
```

---

## 10. SUPER ADMIN CHECK ✅

**What to Look For**:
- Should list at least one Super Admin user
- Should show `✅ Super Admin found`

**If No Super Admin**:
- Create one manually or through signup
- Ensure role is set to `super_admin` or `SuperAdmin`

**Expected Result**:
```
role: super_admin
admin_status: ✅ Super Admin found
```

---

## 11. GETALLCLINICS TEST ✅

**What to Look For**:
- Should return all clinics with their users
- Should include pending clinics
- Should work without RLS errors

**If Query Fails**:
- RLS policies may be blocking
- Check Super Admin policies
- Check helper functions

**If Query Returns Empty**:
- No clinics exist, or
- RLS is blocking access

**Expected Result**:
```
(Should return list of clinics with user data)
```

---

## 12. SUMMARY REPORT ✅

**What to Look For**:
- Total clinics count
- Pending clinics count (should match section 6)
- Active clinics count
- Total users count
- Super Admin count (should be at least 1)

**Use This To**:
- Quick overview of database state
- Verify data exists
- Check for obvious issues

---

## Common Issues and Fixes

### Issue: Trigger Not Found
**Fix**: Run `20260110000000_auto_create_clinic_on_signup.sql`

### Issue: RLS Policies Missing
**Fix**: Run `20260113000007_fix_rls_recursion_complete.sql`

### Issue: Helper Functions Not SECURITY DEFINER
**Fix**: Run `20260113000007_fix_rls_recursion_complete.sql`

### Issue: Pending Clinics Not Showing
**Fix**: 
1. Verify RLS policies allow Super Admin access
2. Check `getAllClinics()` function
3. Verify status filtering in UI

### Issue: Signups Not Creating Clinics
**Fix**:
1. Verify trigger exists and is enabled
2. Check trigger function for errors
3. Verify metadata includes `clinic_name`

---

## Next Steps After Verification

1. **If All Checks Pass**: Test the application end-to-end
2. **If Issues Found**: Apply the recommended fixes
3. **If Still Issues**: Review the comprehensive audit document

---

## Quick Reference

| Check | Expected Result | If Failed |
|-------|----------------|-----------|
| Trigger | ✅ Enabled | Run trigger migration |
| Function | ✅ SECURITY DEFINER | Run trigger migration |
| Clinics RLS | ✅ Has policies | Run RLS migration |
| Users RLS | ✅ Has policies | Run RLS migration |
| Helper Functions | ✅ SECURITY DEFINER | Run RLS migration |
| Pending Clinics | ✅ List exists | Check trigger/signup |
| Recent Signups | ✅ Complete | Check trigger |
| RLS Enabled | ✅ Enabled | Enable RLS |
| Super Admin | ✅ Found | Create Super Admin |
| getAllClinics Test | ✅ Returns data | Check RLS policies |

---

**Run the verification script and compare results with this guide!**
