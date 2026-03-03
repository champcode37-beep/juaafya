-- PERFORMANCE AND SECURITY OPTIMIZATION
-- 1. Optimized Compound Indexes for Multitenancy
-- 2. Automatic Audit Logging Trigger (Security & Performance)
-- 3. Automatic MRN Generation Sequence (Atomic & Fast)

-- 1. Optimized Indexes
-- Most queries filter by clinic_id first. These compound indexes significantly speed up lookups.
CREATE INDEX IF NOT EXISTS idx_patients_clinic_updated ON patients(clinic_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, date, status);
CREATE INDEX IF NOT EXISTS idx_visits_clinic_stage ON visits(clinic_id, stage) WHERE stage != 'completed';
CREATE INDEX IF NOT EXISTS idx_inventory_clinic_stock ON inventory(clinic_id, quantity_in_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_clinic_name ON inventory(clinic_id, name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic_created ON audit_logs(clinic_id, created_at DESC);

-- 2. Performance: MRN Generation Sequence
-- Use a sequence for MRNs instead of client-side counting to prevent race conditions and extra round-trips.
CREATE SEQUENCE IF NOT EXISTS patient_mrn_seq START 1000;

CREATE OR REPLACE FUNCTION generate_patient_mrn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.mrn IS NULL THEN
        NEW.mrn := 'MRN-' || nextval('patient_mrn_seq')::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_mrn ON patients;
CREATE TRIGGER trg_generate_mrn
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION generate_patient_mrn();

-- 3. Security & Performance: Automatic Audit Logger
-- This trigger automatically logs changes to critical tables without extra frontend network calls.
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_clinic_id UUID;
    v_user_id UUID;
    v_user_name TEXT;
    v_user_email TEXT;
    v_action TEXT;
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
BEGIN
    -- Get context from session (Supabase auth.uid() or our own session variable)
    v_user_id := auth.uid();
    v_action := TG_OP;
    
    -- Extract values based on operation
    IF (TG_OP = 'DELETE') THEN
        v_clinic_id := OLD.clinic_id;
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_clinic_id := NEW.clinic_id;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        v_clinic_id := NEW.clinic_id;
        v_new_data := to_jsonb(NEW);
    END IF;

    -- Avoid logging audit logs themselves to prevent recursion
    IF TG_TABLE_NAME = 'audit_logs' THEN
        RETURN NULL;
    END IF;

    -- Look up user info if available
    IF v_user_id IS NOT NULL THEN
        SELECT full_name, email INTO v_user_name, v_user_email FROM public.users WHERE id = v_user_id;
    END IF;

    -- Insert into audit_logs
    INSERT INTO public.audit_logs (
        clinic_id,
        user_id,
        user_name,
        user_email,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        status
    ) VALUES (
        v_clinic_id,
        v_user_id,
        COALESCE(v_user_name, 'System'),
        v_user_email,
        v_action || ' ' || TG_TABLE_NAME,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text 
            ELSE NEW.id::text 
        END,
        v_old_data,
        v_new_data,
        'Success'
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply automatic auditing to core tables
DROP TRIGGER IF EXISTS trg_audit_patients ON patients;
CREATE TRIGGER trg_audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_inventory ON inventory;
CREATE TRIGGER trg_audit_inventory
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

DROP TRIGGER IF EXISTS trg_audit_visits ON visits;
CREATE TRIGGER trg_audit_visits
    AFTER INSERT OR UPDATE OR DELETE ON visits
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();
