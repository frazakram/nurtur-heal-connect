-- Store patient email on appointments so reminders can be sent the day before
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email TEXT;
