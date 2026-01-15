# Troubleshooting Signup 500 Error

## Problem
You're getting a `500 Internal Server Error` when trying to sign up a new user.

## Root Cause
This error typically occurs when the database trigger function fails during user creation. The trigger is supposed to automatically create a clinic and user profile, but something is preventing it from completing.

## Step 1: Check if Migration Has Been Applied

The fix requires running the updated migration in your Supabase database. 

1. Go to your Supabase Dashboard: [YOUR_SUPABASE_URL]
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the **entire contents** of `supabase/migrations/20260110000000_auto_create_clinic_on_signup.sql`
5. Paste and click **Run**

## Step 2: Verify the Trigger Exists

Run this query in Supabase SQL Editor to check if the trigger is set up correctly:

```sql
-- Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user_signup';
```

You should see:
- `trigger_name`: `on_auth_user_created`
- `table_name`: `auth.users`
- `function_name`: `handle_new_user_signup`
- `is_security_definer`: `true`

## Step 3: Check Supabase Logs for Detailed Error

The 500 error doesn't show the actual database error. To see what's really failing:

1. Go to Supabase Dashboard → **Logs** → **Postgres Logs**
2. Try signing up again
3. Look for error messages in the logs around the time of the signup attempt
4. Common errors you might see:
   - `permission denied for table clinics`
   - `violates check constraint`
   - `null value in column "X" violates not-null constraint`
   - `duplicate key value violates unique constraint`

## Step 4: Run Diagnostic Script

Run the diagnostic script to check for common issues:

1. Open `supabase/migrations/20260112000000_diagnose_signup_issue.sql` in Supabase SQL Editor
2. Run all the queries
3. Check the results for:
   - Missing tables or columns
   - RLS policies that might be blocking inserts
   - Trigger/function issues

## Common Issues and Fixes

### Issue 1: Trigger Function Doesn't Exist
**Symptom**: No trigger found in diagnostic query

**Fix**: Run the migration file `20260110000000_auto_create_clinic_on_signup.sql`

### Issue 2: RLS Blocking Inserts
**Symptom**: Logs show "permission denied" or "row-level security policy violation"

**Fix**: The migration should have added a policy for activities. If not, run:
```sql
CREATE POLICY "System can insert activities" ON public.activities
  FOR INSERT
  WITH CHECK (true);
```

### Issue 3: Missing Required Columns
**Symptom**: Logs show "null value violates not-null constraint"

**Fix**: Check that the `clinics` table has all required columns:
- `name` (NOT NULL)
- `slug` (NOT NULL, UNIQUE)
- `country` (NOT NULL, has DEFAULT 'KE')

### Issue 4: Duplicate Slug
**Symptom**: Logs show "duplicate key value violates unique constraint" on slug

**Fix**: The trigger should handle this, but if it persists, the slug generation logic might need adjustment.

### Issue 5: Function Owner Issues
**Symptom**: Function exists but still getting permission errors

**Fix**: Ensure function is owned by postgres:
```sql
ALTER FUNCTION public.handle_new_user_signup() OWNER TO postgres;
```

## Step 5: Test with Manual Insert

If the trigger still fails, test if you can manually insert data:

```sql
-- This simulates what the trigger should do
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_clinic_id UUID;
BEGIN
  -- Try creating a clinic
  INSERT INTO public.clinics (
    name, slug, owner_id, email, status, plan, country
  ) VALUES (
    'Test Clinic',
    'test-clinic-' || substring(test_user_id::text from 1 for 8),
    test_user_id,
    'test@example.com',
    'pending',
    'free',
    'KE'
  ) RETURNING id INTO test_clinic_id;
  
  RAISE NOTICE 'Clinic created: %', test_clinic_id;
  
  -- Try creating a user
  INSERT INTO public.users (
    id, clinic_id, email, full_name, role, status
  ) VALUES (
    test_user_id,
    test_clinic_id,
    'test@example.com',
    'Test User',
    'admin',
    'active'
  );
  
  RAISE NOTICE 'User created successfully';
  
  -- Clean up
  DELETE FROM public.users WHERE id = test_user_id;
  DELETE FROM public.clinics WHERE id = test_clinic_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error: % - %', SQLSTATE, SQLERRM;
END $$;
```

If this fails, the error message will tell you exactly what's wrong.

## Still Having Issues?

If none of the above fixes work:

1. **Check browser console** - Look for any additional error details
2. **Check network tab** - The actual error response might be in the response body
3. **Contact support** - Share the error logs from Supabase Postgres Logs

## Prevention

To avoid this issue in the future:
- Always run migrations in order
- Test signup after each migration
- Monitor Supabase logs regularly
- Keep migration files in version control
