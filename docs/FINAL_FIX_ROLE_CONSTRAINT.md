# Final Fix for Role Constraint Violation

## Error
```
Failed to create user profile: new row for relation "users" violates check constraint "users_role_check"
```

## Solution
Run this migration: `supabase/migrations/20260113000020_fix_constraint_by_dropping_all.sql`

## What This Does

### Step 1: Find and Drop ALL Role Constraints
- Finds ALL check constraints on the `users` table that mention "role"
- Drops them regardless of their name
- This works even if the constraint has a different name

### Step 2: Create Correct Constraint
- Creates a new constraint named `users_role_check`
- Explicitly allows all valid roles:
  - `'super_admin'`
  - `'admin'`
  - `'doctor'`
  - `'nurse'`
  - `'receptionist'`
  - `'lab_tech'`
  - `'pharmacist'`
  - `'accountant'`

### Step 3: Recreate Trigger Function
- Creates a new trigger function
- Always validates the role value
- Falls back to `'doctor'` if role is invalid
- Includes better error messages

### Step 4: Recreate Trigger
- Drops and recreates the trigger
- Ensures it uses the new function

### Step 5: Verify
- Checks that constraint exists
- Checks that trigger exists

## Why This Works

The previous migrations might have failed if:
- The constraint had a different name
- The constraint was inline (no name)
- There were multiple constraints

This migration:
- Finds ALL role constraints regardless of name
- Drops them all
- Creates a fresh constraint with the correct name
- Guarantees the trigger uses valid role values

## How to Apply

1. Open Supabase SQL Editor
2. Copy the entire contents of `supabase/migrations/20260113000020_fix_constraint_by_dropping_all.sql`
3. Paste and click "Run"
4. Check the verification results - both should show ✅ YES

## After Applying

Try signing up again. The error should be resolved because:
- The constraint now explicitly allows all valid roles including 'admin'
- The trigger validates roles before using them
- The trigger always falls back to 'doctor' if role is invalid
