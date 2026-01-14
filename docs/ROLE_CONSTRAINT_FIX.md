# Role Constraint Fix

## Error
```
Failed to create user profile: new row for relation "users" violates check constraint "users_role_check"
```

## Root Cause
The trigger function is trying to insert a role value that doesn't match the `users_role_check` constraint.

## Valid Roles
According to the schema (`scripts/001-create-complete-schema.sql`), valid roles are:
- `'super_admin'`
- `'admin'`
- `'doctor'` (default)
- `'nurse'`
- `'receptionist'`
- `'lab_tech'`
- `'pharmacist'`
- `'accountant'`

All roles must be **lowercase with underscores**.

## Fix Applied
Updated the trigger function in `supabase/migrations/20260113000010_complete_system_fix.sql` to:

1. **Normalize role**: Convert to lowercase and replace spaces with underscores
2. **Validate role**: Check against allowed list
3. **Fallback to 'doctor'**: Use 'doctor' (the schema default) if role is invalid

## Changes Made

### Before:
```sql
v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
```

### After:
```sql
-- Use 'doctor' as default role (schema default)
v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'doctor');

-- Normalize role to lowercase with underscore (matching constraint format)
v_role := lower(replace(v_role, ' ', '_'));

-- Validate role is in allowed list, fallback to 'doctor' if not
IF v_role NOT IN ('super_admin', 'admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist', 'accountant') THEN
  v_role := 'doctor';
END IF;
```

## Testing
After applying the migration:
1. Try signing up a new clinic
2. Should succeed without constraint violation
3. User should be created with role = 'doctor' (or valid role from metadata)
