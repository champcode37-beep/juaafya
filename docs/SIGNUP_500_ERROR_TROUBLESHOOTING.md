# Signup 500 Error Troubleshooting

## Error Message
```
POST /auth/v1/signup 500 (Internal Server Error)
AuthApiError: Database error saving new user
```

This error means the trigger `handle_new_user_signup()` is failing.

## Diagnosis Steps

### Step 1: Check if Trigger Exists
Run in Supabase SQL Editor:
```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE WHEN tgenabled = 'O' THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected**: Should return 1 row with trigger_name = 'on_auth_user_created'

### Step 2: Check if Function Exists
```sql
SELECT 
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'handle_new_user_signup';
```

**Expected**: Should return 1 row with is_security_definer = true

### Step 3: Check RLS Policies
```sql
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'clinics'
  AND policyname LIKE '%System%insert%';
```

**Expected**: Should have policy "System can insert clinics" with WITH CHECK (true)

### Step 4: Check Supabase Logs
1. Go to Supabase Dashboard
2. Click "Logs" in the sidebar
3. Click "Postgres Logs"
4. Try signup again
5. Check for error messages

**Look for**: Errors like:
- "Failed to create clinic: ..."
- "Failed to create user profile: ..."
- Constraint violations
- Permission errors

### Step 5: Check Table Schema
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'clinics'
  AND column_name IN ('name', 'slug', 'owner_id', 'email', 'status', 'plan', 'country', 'currency', 'timezone', 'plan_seats')
ORDER BY ordinal_position;
```

**Expected**: All columns should exist

## Common Issues

### Issue 1: Trigger Doesn't Exist
**Symptom**: Step 1 query returns 0 rows

**Fix**: Run migration `20260113000010_complete_system_fix.sql`

### Issue 2: RLS Policy Missing
**Symptom**: Step 3 query returns 0 rows

**Fix**: The migration should have created it. Check if migration ran successfully.

### Issue 3: Function Error (Check Supabase Logs)
**Symptom**: Error in Supabase logs

**Common Errors**:
- `null value in column "xxx" violates not-null constraint` → Missing column
- `foreign key constraint violation` → Invalid foreign key value
- `permission denied` → RLS policy issue

### Issue 4: Foreign Key Constraint
**Symptom**: Error mentions `clinics_owner_id_fkey`

**Possible Cause**: The trigger tries to insert clinic with `owner_id = NEW.id` before the user exists in `auth.users`.

**Fix**: This shouldn't happen - `NEW.id` should already exist in `auth.users` when the trigger fires.

## Quick Fix: Temporarily Disable Trigger

To test if trigger is the issue:

```sql
-- Disable trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Try signup again (will create user but not clinic)

-- Re-enable trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

## Next Steps

1. Run diagnostic queries above
2. Check Supabase logs for actual error
3. Share the actual error message for targeted fix
