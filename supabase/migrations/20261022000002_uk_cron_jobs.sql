-- =========================================================================
-- Migration: 20261022000002_uk_cron_jobs.sql
-- Vertex Dental Lab — UK Cron Jobs (pg_cron + Edge Functions)
-- Job A: Daily 08:00 AM UK Schedule Email
-- Job B: 1-Hour Prior Patient SMS Reminder (Every 5 Minutes)
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =========================================================================
-- JOB A: Daily 08:00 AM UK Schedule Email
-- Trigger daily at exactly 08:00 in Europe/London timezone (handles GMT/BST).
-- Strictly filters appt_date = (now() AT TIME ZONE 'Europe/London')::date ONLY.
-- =========================================================================

CREATE OR REPLACE FUNCTION trigger_daily_uk_schedule_email()
RETURNS void AS $$
DECLARE
    current_london_hour INT;
    current_london_date DATE;
    already_sent BOOLEAN;
    supabase_project_url TEXT;
    service_role_key TEXT;
BEGIN
    -- 1. Evaluate current date & hour in Europe/London timezone
    current_london_hour := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Europe/London'));
    current_london_date := (NOW() AT TIME ZONE 'Europe/London')::date;

    -- 2. Strictly trigger at 08:00 AM Europe/London time
    IF current_london_hour != 8 THEN
        RETURN;
    END IF;

    -- 3. Idempotency Check: Don't email twice on the same London date
    SELECT EXISTS (
        SELECT 1 FROM public.daily_reports_log
        WHERE report_date = current_london_date AND status = 'SENT'
    ) INTO already_sent;

    IF already_sent THEN
        RETURN;
    END IF;

    -- 4. Invoke Edge Function via pg_net
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

    IF supabase_project_url IS NOT NULL THEN
        PERFORM net.http_post(
            url := supabase_project_url || '/functions/v1/daily-owner-report?date=' || current_london_date,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
            ),
            body := '{}'::jsonb
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule Job A in pg_cron (Checks 07:00 and 08:00 UTC to account for BST / GMT)
DO $$
BEGIN
    PERFORM cron.unschedule('daily-08am-uk-schedule-email');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'daily-08am-uk-schedule-email',
        '0 7,8 * * *',
        'SELECT trigger_daily_uk_schedule_email();'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron setup note for Job A: %', SQLERRM;
END $$;

-- =========================================================================
-- JOB B: 1-Hour Prior Patient SMS Reminder
-- Runs every 5 minutes (*/5 * * * *).
-- Evaluates appointments where:
--   appt_date = (now() AT TIME ZONE 'Europe/London')::date
--   reminder_sent = false
--   appt_time BETWEEN (now() AT TIME ZONE 'Europe/London')::time + interval '55 minutes'
--                 AND (now() AT TIME ZONE 'Europe/London')::time + interval '65 minutes'
-- =========================================================================

CREATE OR REPLACE FUNCTION trigger_patient_1hr_sms_reminders()
RETURNS void AS $$
DECLARE
    supabase_project_url TEXT;
    service_role_key TEXT;
    has_due_reminders BOOLEAN;
    current_london_date DATE;
    current_london_time TIME;
BEGIN
    current_london_date := (NOW() AT TIME ZONE 'Europe/London')::date;
    current_london_time := (NOW() AT TIME ZONE 'Europe/London')::time;

    -- Query if any appointment is due in the 55m-65m window today
    SELECT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE appt_date = current_london_date
          AND reminder_sent = false
          AND appt_time >= (current_london_time + INTERVAL '55 minutes')
          AND appt_time <= (current_london_time + INTERVAL '65 minutes')
    ) INTO has_due_reminders;

    IF NOT has_due_reminders THEN
        RETURN;
    END IF;

    -- Invoke Edge Function via pg_net
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

-- Schedule Job B in pg_cron (Every 5 minutes)
DO $$
BEGIN
    PERFORM cron.unschedule('patient-sms-reminders-5min');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'patient-sms-reminders-5min',
        '*/5 * * * *',
        'SELECT trigger_patient_1hr_sms_reminders();'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron setup note for Job B: %', SQLERRM;
END $$;
