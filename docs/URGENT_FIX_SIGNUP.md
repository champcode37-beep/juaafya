# URGENT: Fix Signup 500 Error - Step by Step

## The Problem
You're getting `Database error saving new user` - the trigger is failing but we can't see why.

## Solution: Run These in Order

### Step 1: Run Diagnostic (2 minutes)
**This will show you what's actually configured:**

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy **entire contents** of `supabase/migrations/20260113000002_quick_diagnostic.sql`
3. Paste and **Run**
4. **Look at the results** - it will show:
   - If trigger exists
   - If function exists
   - What RLS policies exist
   - If direct insert works

**If the direct insert test FAILS**, that's your problem - the error message will tell you exactly what's wrong.

### Step 2: Apply Minimal Trigger (1 minute)
**This is the simplest possible trigger to test:**

1. In SQL Editor, click **New Query**
2. Copy **entire contents** of `supabase/migrations/20260113000003_minimal_trigger.sql`
3. Paste and **Run**

This version:
- Has minimal logic
- Catches errors but doesn't fail auth user creation
- Will show warnings in logs if it fails

### Step 3: Try Signing Up Again
After applying the minimal trigger, try signing up again.

### Step 4: Check What Happened

**Option A: Check Supabase Logs**
1. Go to **Logs** → **Postgres Logs**
2. Look for messages with "Signup trigger error" or warnings

**Option B: Check if User Was Created**
Run this query:
```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'champcode37@gmail.com'
ORDER BY created_at DESC 
LIMIT 1;
```

**Option C: Check if Profile Was Created**
```sql
SELECT id, email, full_name, clinic_id 
FROM public.users 
WHERE email = 'champcode37@gmail.com';
```

**Option D: Check if Clinic Was Created**
```sql
SELECT id, name, slug, status, owner_id 
FROM public.clinics 
WHERE email = 'champcode37@gmail.com' 
  OR owner_id IN (
    SELECT id FROM auth.users WHERE email = 'champcode37@gmail.com'
  );
```

## What Each Result Means

### If Diagnostic Test FAILS:
- The error message tells you exactly what's wrong
- Common issues:
  - Missing table/column
  - Constraint violation
  - Permission issue

### If Diagnostic Test PASSES but Signup Still Fails:
- The trigger itself has an issue
- Check Postgres Logs for the warning message
- The minimal trigger will show the error in logs

### If User Created but No Profile:
- Trigger ran but failed to create profile
- Check Postgres Logs for the warning
- User can still log in, but profile needs to be created manually

### If Nothing Created:
- Trigger might not be firing
- Check if trigger exists (from diagnostic)
- Check if function is SECURITY DEFINER

## Most Common Issues

### Issue 1: Tables Don't Exist
**Symptom**: Diagnostic shows "relation does not exist"
**Fix**: Run the schema creation script first

### Issue 2: RLS Blocking
**Symptom**: Diagnostic insert fails with "permission denied"
**Fix**: The minimal trigger creates the policies automatically

### Issue 3: Constraint Violation
**Symptom**: Diagnostic shows specific constraint error
**Fix**: The error message will tell you which constraint and value

### Issue 4: Missing Required Field
**Symptom**: "null value violates not-null constraint"
**Fix**: Minimal trigger provides all required fields

## Quick Test

After applying minimal trigger, run this to test:

```sql
-- This simulates a signup
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Create auth user (this will trigger the trigger)
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data
  ) VALUES (
    test_id,
    'test-' || substring(test_id::text from 1 for 8) || '@test.com',
    crypt('test123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"clinic_name": "Test Clinic", "full_name": "Test User", "role": "admin"}'::jsonb
  );
  
  RAISE NOTICE 'Auth user created: %', test_id;
  
  -- Check if profile was created
  IF EXISTS (SELECT 1 FROM public.users WHERE id = test_id) THEN
    RAISE NOTICE '✓ User profile created';
  ELSE
    RAISE WARNING '✗ User profile NOT created';
  END IF;
  
  -- Check if clinic was created
  IF EXISTS (SELECT 1 FROM public.clinics WHERE owner_id = test_id) THEN
    RAISE NOTICE '✓ Clinic created';
  ELSE
    RAISE WARNING '✗ Clinic NOT created';
  END IF;
  
  -- Cleanup
  DELETE FROM public.users WHERE id = test_id;
  DELETE FROM public.clinics WHERE owner_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Test failed: %', SQLERRM;
END $$;
```

## Still Not Working?

1. **Share the diagnostic output** - especially the direct insert test result
2. **Share Postgres Logs** - look for any error messages
3. **Share the test query results** - did user/profile/clinic get created?

The diagnostic will tell us exactly what's wrong!
