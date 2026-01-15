# Step-by-Step Fix for Signup 500 Error

## Current Status
You're getting: `Database error saving new user` - This means the trigger is running but failing.

## Step 1: Apply the Debug Migration

1. Go to [YOUR_SUPABASE_URL]
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the **entire contents** of `supabase/migrations/20260113000000_fix_signup_trigger_debug.sql`
5. Paste and click **Run**
6. You should see "Success. No rows returned"

## Step 2: Run the Test Script

This will verify everything is set up correctly:

1. In Supabase SQL Editor, click **New Query**
2. Copy the **entire contents** of `supabase/migrations/20260113000001_test_trigger_manually.sql`
3. Paste and click **Run**
4. Look at the output - it will show:
   - ✓ for successful tests
   - ✗ for failed tests
   - Detailed error messages if something fails

**If the test script fails**, the error message will tell you exactly what's wrong.

## Step 3: Check Supabase Logs (CRITICAL)

The actual error is in Supabase logs. To see it:

1. Go to Supabase Dashboard → **Logs** (left sidebar)
2. Click **Postgres Logs**
3. **Keep this tab open**
4. Go back to your app and try signing up again
5. **Immediately** go back to the Postgres Logs tab
6. Look for the most recent error messages

You should see messages like:
- `Trigger fired for user: ...`
- `Generated slug: ...`
- `Failed to create clinic: ...` (if clinic creation fails)
- `Failed to create user profile: ...` (if user creation fails)

**Copy the exact error message** - this will tell us what's wrong.

## Step 4: Common Issues Based on Error Messages

### If you see: "permission denied for table clinics"
**Problem**: RLS is blocking the insert
**Fix**: Run this in SQL Editor:
```sql
DROP POLICY IF EXISTS "System can insert clinics" ON public.clinics;
CREATE POLICY "System can insert clinics" ON public.clinics
  FOR INSERT
  WITH CHECK (true);
```

### If you see: "null value in column X violates not-null constraint"
**Problem**: Missing required field
**Fix**: The debug migration should have fixed this, but check the error to see which column

### If you see: "duplicate key value violates unique constraint"
**Problem**: Slug already exists
**Fix**: The debug migration uses a WHILE loop to ensure unique slugs

### If you see: "violates check constraint"
**Problem**: Value doesn't match allowed values (e.g., status must be 'pending', 'active', etc.)
**Fix**: Check what value is being inserted vs what's allowed

### If you see: "relation does not exist"
**Problem**: Table doesn't exist
**Fix**: Run the schema creation script first

## Step 5: Alternative - Temporarily Disable Trigger

If you need to test if the trigger is the problem:

1. Run this in SQL Editor:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

2. Try signing up - if it works, the trigger is definitely the problem
3. Re-enable the trigger by running the debug migration again

## Step 6: Manual Verification

Check if the trigger exists:
```sql
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

Check if the function exists:
```sql
SELECT proname, prosecdef, proowner::regrole
FROM pg_proc 
WHERE proname = 'handle_new_user_signup';
```

You should see:
- `tgname`: `on_auth_user_created`
- `proname`: `handle_new_user_signup`
- `prosecdef`: `true` (must be true for SECURITY DEFINER)

## Step 7: If Still Not Working

1. **Share the exact error from Postgres Logs** - this is the most important
2. **Share the output from the test script** - this will show what's failing
3. **Check if tables exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clinics', 'users', 'activities');
```

## Quick Checklist

- [ ] Applied debug migration (`20260113000000_fix_signup_trigger_debug.sql`)
- [ ] Ran test script (`20260113000001_test_trigger_manually.sql`)
- [ ] Checked Postgres Logs for actual error
- [ ] Verified trigger exists
- [ ] Verified function exists and is SECURITY DEFINER
- [ ] Verified RLS policies exist

## Most Likely Issues

Based on the error pattern, the most likely causes are:

1. **RLS blocking inserts** - Fixed by adding "System can insert" policies
2. **Missing required fields** - Fixed by explicitly providing all fields
3. **Constraint violations** - Need to see the exact error to fix
4. **Function permissions** - Fixed by setting owner to postgres

The debug migration addresses all of these. If it still fails, the Postgres Logs will show the exact error.
