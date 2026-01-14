# Immediate Fix for Role Constraint Violation

## Error
```
Failed to create user profile: new row for relation "users" violates check constraint "users_role_check"
```

## Root Cause
The trigger is trying to insert a role value that doesn't match the `users_role_check` constraint in the actual database.

## Solution
Run the migration: `supabase/migrations/20260113000018_fix_role_constraint_immediate.sql`

This migration:
1. **Checks the actual constraint** - Shows what roles are currently allowed
2. **Updates the constraint** - Ensures it allows all valid roles including 'admin'
3. **Recreates the trigger** - Uses guaranteed valid role values
4. **Verifies the fix** - Confirms trigger exists and constraint allows 'admin'

## What It Does

### Step 1: Check Actual Constraint
Shows what the constraint currently allows (might be different than expected)

### Step 2: Update Constraint
Drops and recreates the constraint to explicitly allow:
- `'super_admin'`
- `'admin'`
- `'doctor'`
- `'nurse'`
- `'receptionist'`
- `'lab_tech'`
- `'pharmacist'`
- `'accountant'`

### Step 3: Recreate Trigger Function
Creates a new trigger function that:
- Always validates the role before using it
- Falls back to 'doctor' if role is invalid
- Includes better error messages showing what role was attempted

### Step 4: Recreate Trigger
Drops and recreates the trigger to use the new function

### Step 5: Verify
Checks that:
- Trigger exists
- Constraint allows 'admin'

## How to Apply

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `supabase/migrations/20260113000018_fix_role_constraint_immediate.sql`
3. Click "Run"
4. Check the results - should show:
   - Actual constraint definition
   - Current roles in database
   - Verification: ✅ YES for both checks

## After Applying

Try signing up again. The error should be resolved because:
- The constraint now explicitly allows 'admin'
- The trigger validates roles before using them
- The trigger falls back to 'doctor' if role is invalid
