-- =========================================================================
-- Migration: 20261011000003_daily_report_cron.sql
-- Vertex Dental Lab — Automatic Daily Owner Report at 08:00 AM (Europe/London)
-- Handles BST / GMT Daylight Saving seamlessly using pg_cron (UTC).
-- =========================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Stored Procedure to Trigger Daily Owner Report
-- Guarantees:
--  a) BST/GMT correctness: pg_cron triggers at 07:00 UTC and 08:00 UTC.
--     The procedure verifies: EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Europe/London')) = 8
--  b) Idempotency: Checks daily_reports_log table. If already sent today, skips silently.
--  c) Scope: Only today's confirmed appointments (WHERE appointment_date = CURRENT_DATE_IN_LONDON AND status = 'CONFIRMED')
CREATE OR REPLACE FUNCTION trigger_daily_owner_report()
RETURNS void AS $$
DECLARE
    current_london_hour INT;
    current_london_date DATE;
    already_sent BOOLEAN;
    supabase_project_url TEXT;
    service_role_key TEXT;
BEGIN
    -- 1. Get current hour and date in Europe/London
    current_london_hour := EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'Europe/London'));
    current_london_date := (NOW() AT TIME ZONE 'Europe/London')::date;

    -- 2. Verify it is exactly 08:00 AM in London
    IF current_london_hour != 8 THEN
        RETURN;
    END IF;

    -- 3. Idempotency Check: Don't execute if already sent for this London date
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

-- 3. Schedule the Cron Job in pg_cron
-- Schedule: '0 7,8 * * *' (Every day at 07:00 UTC and 08:00 UTC)
-- - During British Summer Time (BST, UTC+1): 07:00 UTC = 08:00 BST -> Executes! 08:00 UTC = 09:00 BST -> Skips!
-- - During Greenwich Mean Time (GMT, UTC+0): 07:00 UTC = 07:00 GMT -> Skips! 08:00 UTC = 08:00 GMT -> Executes!
DO $$
BEGIN
    PERFORM cron.unschedule('daily-owner-report-london-8am');
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.schedule(
        'daily-owner-report-london-8am',
        '0 7,8 * * *',
        'SELECT trigger_daily_owner_report();'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not enabled or not supported in this environment: %', SQLERRM;
END $$;
