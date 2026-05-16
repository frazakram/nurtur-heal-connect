-- Idempotent multi-window appointment reminders + booking drop-off capture.
-- Run once in the Supabase SQL editor.

-- 1. Reminder tracking ------------------------------------------------------
-- One set of columns per reminder window. The reminder cron only sends when
-- *_sent is false, sets it true on success, and records the error (leaving
-- *_sent false) on failure so the next run retries. Safe to run repeatedly.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_7d_sent  boolean NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_7d_at    timestamptz;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_7d_error text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1d_sent  boolean NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1d_at    timestamptz;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1d_error text;

-- 2. Booking drop-offs ------------------------------------------------------
-- Partial bookings abandoned before confirmation, so staff can follow up on
-- otherwise-lost leads. One row per chatbot session, upserted as the patient
-- progresses; marked 'booked' when they complete.
CREATE TABLE IF NOT EXISTS booking_dropoffs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text UNIQUE NOT NULL,
  stage         text NOT NULL DEFAULT 'started',
  patient_name  text,
  phone         text,
  email         text,
  doctor_name   text,
  department    text,
  date          text,
  time          text,
  status        text NOT NULL DEFAULT 'open',   -- open | booked | recovered | dismissed
  source        text NOT NULL DEFAULT 'chatbot',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_dropoffs_status_updated
  ON booking_dropoffs (status, updated_at DESC);

-- RLS: the booking widget runs with the anon key and must upsert dropoffs;
-- admin (authenticated) needs read/manage. Mirrors how the public Contact
-- form / chatbot already write to messages & appointments. If your other
-- public-write tables have RLS disabled, you may skip this block.
ALTER TABLE booking_dropoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dropoffs_public_insert ON booking_dropoffs;
CREATE POLICY dropoffs_public_insert ON booking_dropoffs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS dropoffs_public_update ON booking_dropoffs;
CREATE POLICY dropoffs_public_update ON booking_dropoffs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS dropoffs_auth_select ON booking_dropoffs;
CREATE POLICY dropoffs_auth_select ON booking_dropoffs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS dropoffs_auth_delete ON booking_dropoffs;
CREATE POLICY dropoffs_auth_delete ON booking_dropoffs
  FOR DELETE TO authenticated USING (true);
