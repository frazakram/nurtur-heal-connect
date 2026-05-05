-- Add precautions column to doctors table
-- Medical assistants write pre-visit instructions per doctor
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS precautions TEXT;
