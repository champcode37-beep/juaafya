-- FIX: proc_audit_log failure when inserting patients
-- The error "record 'v_user_record' has no field 'email'" occurs because
-- an uninitialized RECORD type cannot be evaluated if no row was returned or assigned.
-- We declare explicit variables instead to make this robust.

CREATE OR REPLACE FUNCTION public.proc_audit_log()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_email TEXT := 'system@juaafya.com';
    v_user_name TEXT := 'System';
    v_user_role TEXT := 'system';
    v_clinic_id UUID;
    v_action TEXT := TG_OP;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_resource_id TEXT;
BEGIN
    -- Only proceed if there is an authenticated user
    IF v_user_id IS NOT NULL THEN
        SELECT clinic_id, full_name, email, role 
        INTO v_clinic_id, v_user_name, v_user_email, v_user_role 
        FROM public.users WHERE id = v_user_id;
    END IF;

    -- Fallback for changes during signup or system processes
    -- Note: Profile might not exist yet for new signups or no user returned
    IF v_clinic_id IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            v_clinic_id := OLD.clinic_id;
        ELSE
            v_clinic_id := NEW.clinic_id;
        END IF;
    END IF;

    -- Capture Data
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_resource_id := NEW.id::text;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_resource_id := OLD.id::text;
    END IF;

    -- Insert into audit_logs
    INSERT INTO public.audit_logs (
        clinic_id,
        user_id,
        user_email,
        user_name,
        user_role,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        status
    ) VALUES (
        v_clinic_id,
        v_user_id,
        COALESCE(v_user_email, 'system@juaafya.com'),
        COALESCE(v_user_name, 'System'),
        COALESCE(v_user_role, 'system'),
        v_action,
        TG_TABLE_NAME,
        v_resource_id,
        v_old_data,
        v_new_data,
        'Success'
    );

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
