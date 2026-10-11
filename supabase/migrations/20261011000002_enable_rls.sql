-- =========================================================================
-- Migration: 20261011000002_enable_rls.sql
-- Vertex Dental Lab — Row Level Security (RLS) & Access Control
-- Enforces:
--   - Public users may ONLY insert appointments and read slot availability without PII
--   - Admins (role = 'admin') can read, update, and manage all records
--   - Protects Special Category Health Data under UK GDPR
-- =========================================================================

-- 1. Helper function: verify if requesting user is an authorized clinic admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Direct claim in JWT
    COALESCE(auth.jwt() ->> 'role', '') = 'admin' OR
    -- Claim in app_metadata
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
    -- Claim in user_metadata
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin' OR
    -- Service role bypass
    COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports_log ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 3. APPOINTMENTS POLICIES
-- -------------------------------------------------------------------------

-- Policy A: Public (anon and authenticated) can create an appointment
DROP POLICY IF EXISTS "Public can book appointments" ON appointments;
CREATE POLICY "Public can book appointments"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (
    patient_name IS NOT NULL AND
    phone_number IS NOT NULL AND
    reason IS NOT NULL AND
    slot_time IS NOT NULL
);

-- Policy B: Only Admins can view full appointment records (with PII: names, phones, reasons)
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments"
ON appointments FOR SELECT
TO authenticated
USING (is_admin());

-- Policy C: Only Admins can update appointments (mark completed, cancel, etc.)
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;
CREATE POLICY "Admins can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy D: Only Admins can delete appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
CREATE POLICY "Admins can delete appointments"
ON appointments FOR DELETE
TO authenticated
USING (is_admin());

-- -------------------------------------------------------------------------
-- 4. NON-PII SLOT AVAILABILITY (Secure Public View & Function)
-- -------------------------------------------------------------------------

-- Create a secure view for checking slot occupancy WITHOUT any patient PII
CREATE OR REPLACE VIEW public_slot_occupancy AS
SELECT 
    slot_time, 
    slot_end_time, 
    clinician_name, 
    status
FROM appointments
WHERE status != 'CANCELLED';

GRANT SELECT ON public_slot_occupancy TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 5. PATIENTS POLICIES
-- -------------------------------------------------------------------------

-- Policy A: Public can insert/upsert patient contact
DROP POLICY IF EXISTS "Public can insert patients" ON patients;
CREATE POLICY "Public can insert patients"
ON patients FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND
    phone_number IS NOT NULL
);

-- Policy B: Only Admins can view patient records
DROP POLICY IF EXISTS "Admins can view patients" ON patients;
CREATE POLICY "Admins can view patients"
ON patients FOR SELECT
TO authenticated
USING (is_admin());

-- Policy C: Only Admins can update patient records
DROP POLICY IF EXISTS "Admins can update patients" ON patients;
CREATE POLICY "Admins can update patients"
ON patients FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- -------------------------------------------------------------------------
-- 6. DAILY REPORTS LOG POLICIES
-- -------------------------------------------------------------------------

-- Only Admins or service_role can view and create daily reports log
DROP POLICY IF EXISTS "Admins can view daily reports" ON daily_reports_log;
CREATE POLICY "Admins can view daily reports"
ON daily_reports_log FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert daily reports" ON daily_reports_log;
CREATE POLICY "Admins can insert daily reports"
ON daily_reports_log FOR INSERT
TO authenticated
WITH CHECK (is_admin());
