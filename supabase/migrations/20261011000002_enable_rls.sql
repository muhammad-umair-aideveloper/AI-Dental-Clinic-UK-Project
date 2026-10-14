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
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports_log ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- 3. APPOINTMENTS POLICIES
-- -------------------------------------------------------------------------

-- Policy A: Public (anon and authenticated) can create an appointment
DROP POLICY IF EXISTS "Public can book appointments" ON public.appointments;
CREATE POLICY "Public can book appointments"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (
    customer_name IS NOT NULL AND
    phone IS NOT NULL AND
    service IS NOT NULL AND
    appointment_date IS NOT NULL AND
    appointment_time IS NOT NULL
);

-- Policy B: Only Admins can view full appointment records (with PII: names, phones, services)
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
ON public.appointments FOR SELECT
TO authenticated, anon
USING (is_admin() OR auth.role() = 'service_role');

-- Policy C: Only Admins can update appointments (mark completed, cancel, etc.)
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy D: Only Admins can delete appointments
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (is_admin());

-- -------------------------------------------------------------------------
-- 4. NON-PII SLOT AVAILABILITY (Secure Public View)
-- -------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.public_slot_occupancy AS
SELECT 
    appointment_date, 
    appointment_time, 
    status
FROM public.appointments
WHERE status != 'CANCELLED';

GRANT SELECT ON public.public_slot_occupancy TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 5. PATIENTS POLICIES
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can insert patients" ON public.patients;
CREATE POLICY "Public can insert patients"
ON public.patients FOR INSERT
TO anon, authenticated
WITH CHECK (
    name IS NOT NULL AND
    phone IS NOT NULL
);

DROP POLICY IF EXISTS "Admins can view patients" ON public.patients;
CREATE POLICY "Admins can view patients"
ON public.patients FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
CREATE POLICY "Admins can update patients"
ON public.patients FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- -------------------------------------------------------------------------
-- 6. CHAT LOGS POLICIES
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can insert chat logs" ON public.chat_logs;
CREATE POLICY "Public can insert chat logs"
ON public.chat_logs FOR INSERT
TO anon, authenticated
WITH CHECK (
    user_message IS NOT NULL AND
    bot_response IS NOT NULL
);

DROP POLICY IF EXISTS "Admins can view chat logs" ON public.chat_logs;
CREATE POLICY "Admins can view chat logs"
ON public.chat_logs FOR SELECT
TO authenticated
USING (is_admin());

-- -------------------------------------------------------------------------
-- 7. DAILY REPORTS LOG POLICIES
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view daily reports" ON public.daily_reports_log;
CREATE POLICY "Admins can view daily reports"
ON public.daily_reports_log FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert daily reports" ON public.daily_reports_log;
CREATE POLICY "Admins can insert daily reports"
ON public.daily_reports_log FOR INSERT
TO authenticated
WITH CHECK (is_admin());
