-- =========================================================================
-- Migration: 20261011000001_create_appointments_schema.sql
-- Vertex Dental Lab — UK Dental Clinic Appointment & Double-Booking Prevention Schema
-- =========================================================================

-- 1. Enable btree_gist extension for PostgreSQL exclusion constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone_number);

-- 4. APPOINTMENTS TABLE WITH STRICT DATABASE-LEVEL DOUBLE-BOOKING PREVENTION
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    reason TEXT NOT NULL,
    slot_time TIMESTAMPTZ NOT NULL,
    slot_end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'CONFIRMED',
    clinician_name VARCHAR(255) NOT NULL DEFAULT 'Dr. Alistair Vance',
    reminder_consent BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    notes TEXT,
    source VARCHAR(100) NOT NULL DEFAULT 'Website',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DATABASE-LEVEL EXCLUSION CONSTRAINT:
-- Prevents two non-cancelled appointments from having the exact same slot_time with the same clinician.
-- If a second booking request arrives simultaneously, PostgreSQL immediately raises an exclusion violation (23P01).
DO $$ BEGIN
    ALTER TABLE appointments
    ADD CONSTRAINT prevent_double_booking
    EXCLUDE USING gist (
        slot_time WITH =,
        clinician_name WITH =
    ) WHERE (status != 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indexes for lightning-fast queries and reminder polling
CREATE INDEX IF NOT EXISTS idx_appointments_slot_time ON appointments (slot_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments (phone_number);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_poll 
ON appointments (slot_time, status, reminder_consent, reminder_sent);

-- 5. DAILY REPORTS LOG TABLE (Guarantees report is never sent twice per day)
CREATE TABLE IF NOT EXISTS daily_reports_log (
    report_date DATE PRIMARY KEY,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    appointment_count INT NOT NULL DEFAULT 0,
    channel VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT'
);

-- 6. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patients_updated_at ON patients;
CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
