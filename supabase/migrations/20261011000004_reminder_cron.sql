-- =========================================================================
-- Migration: 20261011000004_reminder_cron.sql
-- Vertex Dental Lab — Automatic Patient Reminders 1 Hour Before Appointment
-- Runs every 5 minutes via pg_cron (*/5 * * * *).
-- =========================================================================

-- 1. Ensure required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Stored Procedure to Trigger Patient Reminders
CREATE OR REPLACE FUNCTION trigger_patient_reminders()
RETURNS void AS $$
DECLARE
    supabase_project_url TEXT;
    service_role_key TEXT;
    has_due_appointments BOOLEAN;
    current_london_date DATE;
BEGIN
    current_london_date := (NOW() AT TIME ZONE 'Europe/London')::date;

    -- 1. Quick pre-check: Are there any confirmed appointments today needing a 1-hr reminder?
    SELECT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE status = 'CONFIRMED'
          AND appointment_date = current_london_date
          AND reminder_1hr_sent = false
    ) INTO has_due_appointments;

    -- If no unreminded appointments exist today, do nothing (avoids unnecessary HTTP network calls)
    IF NOT has_due_appointments THEN
        RETURN;
    END IF;

    -- 2. Retrieve credentials from Supabase vault if available
    BEGIN
        SELECT decrypted_secret INTO supabase_project_url 
        FROM vault.decrypted_secrets 
        WHERE name = 'project_url' 
        LIMIT 1;

        SELECT decrypted_secret INTO service_role_key 
        FROM vault.decrypted_secrets 
        WHERE name = 'service_role_key' 
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        supabase_project_url := NULL;
        service_role_key := NULL;
    END;

    -- 3. Dispatch to Edge Function via pg_net
    IF supabase_project_url IS NOT NULL THEN
        PERFORM net.http_post(
            url := supabase_project_url || '/functions/v1/send-patient-reminders',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
            ),
            body := '{}'::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Register the 5-minute cron schedule in pg_cron
DO $$
BEGIN
    PERFORM cron.unschedule('patient-reminders-every-5min');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'patient-reminders-every-5min',
        '*/5 * * * *',
        'SELECT trigger_patient_reminders();'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not enabled or not supported in this environment: %', SQLERRM;
END $$;
