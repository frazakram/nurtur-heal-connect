-- Email-OTP verified booking + human-friendly booking references.
-- Run ONCE in the Supabase SQL editor.
--
-- Adds two things:
--   1. appointments.booking_ref — a short, unguessable code (e.g. CARE-7K2QPM)
--      that a returning patient can quote to book a follow-up. Auto-assigned
--      by a trigger on EVERY insert path (chatbot, modal, admin), so no app
--      code has to generate it. Existing rows are backfilled.
--   2. email_otps — one-time codes the chatbot emails before a booking is
--      allowed, so only someone who controls the email can book. Only the
--      Edge Function (service_role) ever touches this table; RLS denies anon.

-- ── 1. booking_ref ─────────────────────────────────────────────────────────
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_ref text;

-- Unambiguous alphabet (no O/0/I/1) -> easy to read aloud and type.
CREATE OR REPLACE FUNCTION gen_booking_ref() RETURNS text AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := 'CARE-';
    FOR i IN 1..6 LOOP
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM appointments WHERE booking_ref = candidate);
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION set_booking_ref() RETURNS trigger AS $$
BEGIN
  IF NEW.booking_ref IS NULL OR NEW.booking_ref = '' THEN
    NEW.booking_ref := gen_booking_ref();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_booking_ref ON appointments;
CREATE TRIGGER trg_set_booking_ref
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_booking_ref();

-- Backfill any pre-existing appointments.
UPDATE appointments SET booking_ref = gen_booking_ref() WHERE booking_ref IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_appointments_booking_ref
  ON appointments (booking_ref);

-- ── 2. email_otps ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_otps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email        text NOT NULL,
  otp_hash     text NOT NULL,                 -- sha256(lower(email) || ':' || otp)
  purpose      text NOT NULL DEFAULT 'booking',
  expires_at   timestamptz NOT NULL,
  attempts     int  NOT NULL DEFAULT 0,
  max_attempts int  NOT NULL DEFAULT 5,
  consumed     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_email_created
  ON email_otps (lower(email), created_at DESC);

-- Lock the table down: only the Edge Function (service_role, which bypasses
-- RLS) may read/write. With RLS enabled and no anon/authenticated policy,
-- the public anon key cannot read codes or tamper with attempt counts.
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
