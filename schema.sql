-- =========================================================================
-- Vertex Dental Practice Intelligence & Automation System DDL Schema
-- Compatible with PostgreSQL 14+, Supabase, and AWS RDS
-- =========================================================================

-- 1. ENUMS
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE message_type AS ENUM ('T24_REMINDER', 'T2_FINAL_ALERT', 'POST_OP_CARE', 'RECALL_6_MONTH', 'TRIAGE_RESPONSE');
CREATE TYPE message_status AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- 2. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    last_visit_date DATE,
    treatment_type VARCHAR(100),
    recall_sent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_phone ON patients (phone_number);
CREATE INDEX idx_patients_recall ON patients (last_visit_date, recall_sent);

-- 3. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    treatment_type VARCHAR(100) NOT NULL,
    slot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'PENDING',
    clinician_name VARCHAR(255) DEFAULT 'Dr. Alistair Vance',
    notes TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    source VARCHAR(100) DEFAULT 'Website Widget',
    post_op_dispatched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_phone ON appointments (phone_number);
CREATE INDEX idx_appointments_slot_time ON appointments (slot_time);
CREATE INDEX idx_appointments_status ON appointments (status);

-- 4. MESSAGE LOGS (WHATSAPP & SMS AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    patient_phone VARCHAR(50) NOT NULL,
    message_type message_type NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status message_status DEFAULT 'SENT',
    whatsapp_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_message_logs_appointment ON message_logs (appointment_id);
CREATE INDEX idx_message_logs_phone ON message_logs (patient_phone);
CREATE INDEX idx_message_logs_type ON message_logs (message_type);

-- 5. WAITLIST & SLOT RECLAIM TABLE
CREATE TABLE IF NOT EXISTS waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    treatment_type VARCHAR(100) NOT NULL,
    preferred_date DATE,
    notes TEXT,
    alerted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waitlists_alerted ON waitlists (alerted);

-- 6. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
