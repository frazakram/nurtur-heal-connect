-- Race-safe slot booking.
--
-- The app filters out already-booked slots before showing them, but two
-- patients can still pick the same slot in the few seconds between viewing
-- and submitting. This partial unique index is the hard guarantee: Postgres
-- rejects the second insert/update, and the UI shows "that slot was just
-- taken, pick another".
--
-- Partial (WHERE status = 'Scheduled') so that Cancelled / Completed
-- appointments do NOT block the slot from being booked again.
--
-- NOTE: if existing data already has duplicate Scheduled rows for the same
-- (doctor_id, date, time), this index creation will fail. Resolve duplicates
-- first, e.g.:
--
--   WITH d AS (
--     SELECT id, row_number() OVER (
--       PARTITION BY doctor_id, date, time ORDER BY created_at
--     ) AS rn
--     FROM appointments WHERE status = 'Scheduled'
--   )
--   UPDATE appointments SET status = 'Cancelled'
--   WHERE id IN (SELECT id FROM d WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_appointment_slot
  ON appointments (doctor_id, date, time)
  WHERE status = 'Scheduled';
