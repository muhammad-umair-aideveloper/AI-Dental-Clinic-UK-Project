-- =========================================================================
-- schema.sql
-- Vertex Dental Lab — UK Dental Clinic Architecture
-- Supabase PostgreSQL (eu-west-2 London)
-- Single Source of Truth for Appointments, Patients, and Chat Logs
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients (phone);

-- 2. APPOINTMENTS TABLE WITH STRICT DATABASE-LEVEL DOUBLE-BOOKING LOCK
-- Enforces: CONSTRAINT unique_date_time_slot UNIQUE (appointment_date, appointment_time)
-- Rejects duplicate slots with PostgreSQL error code 23505.
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    reminder_1hr_sent BOOLEAN NOT NULL DEFAULT false,
    google_sheet_synced BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Compatibility columns for existing clinical workflows
    patient_name TEXT,
    phone_number TEXT,
    reason TEXT,
    email TEXT,
    notes TEXT,
    source TEXT DEFAULT 'Website',

    -- CRITICAL ANTI-DOUBLE-BOOKING CONSTRAINT (Raises 23505 on duplicate date + time slot)
    CONSTRAINT unique_date_time_slot UNIQUE (appointment_date, appointment_time)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments (appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments (appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (phone);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_poll ON public.appointments (appointment_date, appointment_time, reminder_1hr_sent, status);

-- Sync trigger to guarantee customer_name/patient_name, phone/phone_number, and service/reason consistency
CREATE OR REPLACE FUNCTION sync_appointment_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_name IS NULL AND NEW.patient_name IS NOT NULL THEN
        NEW.customer_name := NEW.patient_name;
    ELSIF NEW.patient_name IS NULL AND NEW.customer_name IS NOT NULL THEN
        NEW.patient_name := NEW.customer_name;
    END IF;

    IF NEW.phone IS NULL AND NEW.phone_number IS NOT NULL THEN
        NEW.phone := NEW.phone_number;
    ELSIF NEW.phone_number IS NULL AND NEW.phone IS NOT NULL THEN
        NEW.phone_number := NEW.phone;
    END IF;

    IF NEW.service IS NULL AND NEW.reason IS NOT NULL THEN
        NEW.service := NEW.reason;
    ELSIF NEW.reason IS NULL AND NEW.service IS NOT NULL THEN
        NEW.reason := NEW.service;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_appointment_columns ON public.appointments;
CREATE TRIGGER trg_sync_appointment_columns
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE PROCEDURE sync_appointment_columns();

-- 3. CHAT LOGS TABLE (Single Source of Truth for AI Receptionist)
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    phone TEXT,
    user_message TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    tools_called JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_session ON public.chat_logs (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_phone ON public.chat_logs (phone);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON public.chat_logs (created_at DESC);

-- 4. DAILY OWNER REPORTS LOG TABLE (Guarantees Idempotency for 8:00 AM London Digest)
CREATE TABLE IF NOT EXISTS public.daily_reports_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    appointment_count INT NOT NULL DEFAULT 0,
    channel TEXT NOT NULL DEFAULT 'email',
    recipient TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports_log (report_date);

-- 5. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patients_updated_at ON public.patients;
CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. ENABLE SUPABASE REALTIME REPLICATION FOR LIVE ADMIN DASHBOARD
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
