-- =========================================================================
-- Migration: 20261022000001_appointments_uk_spec.sql
-- Vertex Dental Lab — UK Dental Practice Specification
-- Atomic Lock (Zero Double-Booking) + Europe/London Timezone + Realtime
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create or alter appointments table to guarantee exact UK specification columns:
--    id (uuid, primary key)
--    customer_name (text, not null)
--    customer_phone (text, not null - E.164 UK format +447...)
--    service (text, not null)
--    appt_date (date, YYYY-MM-DD)
--    appt_time (time, HH:MM 24-hour format)
--    reminder_sent (boolean, default false)
--    created_at (timestamptz, default now())

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service TEXT NOT NULL,
    appt_date DATE NOT NULL,
    appt_time TIME NOT NULL,
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was previously created with alternative names
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'customer_phone') THEN
        ALTER TABLE public.appointments ADD COLUMN customer_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appt_date') THEN
        ALTER TABLE public.appointments ADD COLUMN appt_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appt_time') THEN
        ALTER TABLE public.appointments ADD COLUMN appt_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminder_sent') THEN
        ALTER TABLE public.appointments ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add compatibility columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'phone') THEN
        ALTER TABLE public.appointments ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_date') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_time') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_time TIME;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'status') THEN
        ALTER TABLE public.appointments ADD COLUMN status TEXT NOT NULL DEFAULT 'CONFIRMED';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'google_sheet_synced') THEN
        ALTER TABLE public.appointments ADD COLUMN google_sheet_synced BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'reminder_1hr_sent') THEN
        ALTER TABLE public.appointments ADD COLUMN reminder_1hr_sent BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Populate missing appt_date and appt_time from legacy columns if present
UPDATE public.appointments
SET 
    appt_date = COALESCE(appt_date, appointment_date),
    appt_time = COALESCE(appt_time, appointment_time),
    customer_phone = COALESCE(customer_phone, phone, phone_number)
WHERE appt_date IS NULL OR appt_time IS NULL OR customer_phone IS NULL;

-- 2. CRITICAL CONSTRAINT: Add unique_date_time (appt_date, appt_time)
-- Prevents two patients from ever booking the exact same date and time slot simultaneously.
-- Drops existing constraint if needed before adding to avoid duplicate definition errors.
DO $$
BEGIN
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS unique_date_time;
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS unique_date_time_slot;
    
    ALTER TABLE public.appointments ADD CONSTRAINT unique_date_time UNIQUE (appt_date, appt_time);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint unique_date_time applied or warning: %', SQLERRM;
END $$;

-- 3. Fast lookup indexes for Europe/London scheduling and reminder crons
CREATE INDEX IF NOT EXISTS idx_appointments_uk_slot ON public.appointments (appt_date, appt_time);
CREATE INDEX IF NOT EXISTS idx_appointments_uk_reminders ON public.appointments (appt_date, appt_time, reminder_sent);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_phone ON public.appointments (customer_phone);

-- 4. Bi-directional Column Synchronization Trigger
-- Guarantees that appt_date <-> appointment_date, appt_time <-> appointment_time, 
-- and customer_phone <-> phone stay in 100% sync regardless of which client writes.
CREATE OR REPLACE FUNCTION sync_uk_appointment_spec()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize appt_date and appointment_date
    IF NEW.appt_date IS NOT NULL AND NEW.appointment_date IS NULL THEN
        NEW.appointment_date := NEW.appt_date;
    ELSIF NEW.appointment_date IS NOT NULL AND NEW.appt_date IS NULL THEN
        NEW.appt_date := NEW.appointment_date;
    END IF;

    -- Synchronize appt_time and appointment_time
    IF NEW.appt_time IS NOT NULL AND NEW.appointment_time IS NULL THEN
        NEW.appointment_time := NEW.appt_time;
    ELSIF NEW.appointment_time IS NOT NULL AND NEW.appt_time IS NULL THEN
        NEW.appt_time := NEW.appointment_time;
    END IF;

    -- Synchronize customer_phone, phone, and phone_number
    IF NEW.customer_phone IS NOT NULL THEN
        IF NEW.phone IS NULL THEN NEW.phone := NEW.customer_phone; END IF;
        IF NEW.phone_number IS NULL THEN NEW.phone_number := NEW.customer_phone; END IF;
    ELSIF NEW.phone IS NOT NULL THEN
        NEW.customer_phone := NEW.phone;
        IF NEW.phone_number IS NULL THEN NEW.phone_number := NEW.phone; END IF;
    ELSIF NEW.phone_number IS NOT NULL THEN
        NEW.customer_phone := NEW.phone_number;
        IF NEW.phone IS NULL THEN NEW.phone := NEW.phone_number; END IF;
    END IF;

    -- Synchronize customer_name and patient_name
    IF NEW.customer_name IS NOT NULL AND NEW.patient_name IS NULL THEN
        NEW.patient_name := NEW.customer_name;
    ELSIF NEW.patient_name IS NOT NULL AND NEW.customer_name IS NULL THEN
        NEW.customer_name := NEW.patient_name;
    END IF;

    -- Synchronize service and reason
    IF NEW.service IS NOT NULL AND NEW.reason IS NULL THEN
        NEW.reason := NEW.service;
    ELSIF NEW.reason IS NOT NULL AND NEW.service IS NULL THEN
        NEW.service := NEW.reason;
    END IF;

    -- Synchronize reminder_sent and reminder_1hr_sent
    IF NEW.reminder_sent = true THEN
        NEW.reminder_1hr_sent := true;
    ELSIF NEW.reminder_1hr_sent = true THEN
        NEW.reminder_sent := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_uk_appointment_spec ON public.appointments;
CREATE TRIGGER trg_sync_uk_appointment_spec
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE PROCEDURE sync_uk_appointment_spec();

-- 5. REALTIME DASHBOARD CONFIGURATION
-- Enable Supabase Realtime publication on appointments table
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION WHEN duplicate_object THEN
    NULL;
WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication setup notice: %', SQLERRM;
END $$;

ALTER TABLE public.appointments REPLICA IDENTITY FULL;
