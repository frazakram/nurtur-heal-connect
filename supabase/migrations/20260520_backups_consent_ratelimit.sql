-- Backups + consent + booking abuse protection. Run ONCE in the SQL editor.
-- Depends on 20260518 (booking_ref), 20260519 (is_staff, last10,
-- public_create_appointment). All free-tier; no paid services.

-- ── 1. Consent record on every booking ────────────────────────────────────
-- DPDP Act: keep an auditable timestamp of when the patient agreed to the
-- privacy policy. The booking UIs (modal / portal / bot) gate submission on
-- a consent checkbox, so any row created via the RPC is consented.
alter table appointments add column if not exists consent_at timestamptz;

-- ── 2. Rate-limit public_create_appointment + stamp consent ───────────────
-- Staff (admin/reception) are exempt. Anonymous public bookings are capped
-- per phone: 5 per 10 minutes and 12 per 24 hours (generous enough for a
-- family booking several children, tight enough to stop scripted spam).
create or replace function public_create_appointment(
  p_patient_name text, p_phone text, p_email text,
  p_department text, p_doctor_id uuid, p_date text, p_time text
) returns json
  language plpgsql security definer set search_path = public as $$
declare
  r appointments%rowtype;
  ph text := last10(p_phone);
begin
  if not is_staff() then
    if ph = '' then
      raise exception 'invalid_phone';
    end if;
    if (select count(*) from appointments
        where last10(phone) = ph
          and created_at > now() - interval '10 minutes') >= 5 then
      raise exception 'rate_limited';
    end if;
    if (select count(*) from appointments
        where last10(phone) = ph
          and created_at > now() - interval '24 hours') >= 12 then
      raise exception 'rate_limited';
    end if;
  end if;

  insert into appointments
    (patient_name, phone, patient_email, department, doctor_id,
     date, time, status, consent_at)
  values
    (nullif(p_patient_name,''), nullif(p_phone,''), nullif(p_email,''),
     p_department, p_doctor_id, p_date, p_time, 'Scheduled', now())
  returning * into r;
  return json_build_object('id', r.id, 'booking_ref', r.booking_ref);
end; $$;

revoke all on function public_create_appointment(text,text,text,text,uuid,text,text) from public;
grant execute on function public_create_appointment(text,text,text,text,uuid,text,text) to anon, authenticated;

-- ── 2b. Consent ledger (DPDP audit) ───────────────────────────────────────
-- An explicit, append-only log of every consent given (portal registration,
-- bookings). Complements appointments.consent_at. Writes ONLY via the
-- SECURITY DEFINER record_consent(); staff may read; nobody can edit/delete.
create table if not exists consents (
  id         uuid primary key default gen_random_uuid(),
  subject    text not null,            -- email or phone the consent is tied to
  channel    text not null,            -- 'portal_registration' | 'booking' | ...
  created_at timestamptz not null default now()
);
alter table consents enable row level security;
drop policy if exists consents_staff_read on consents;
create policy consents_staff_read on consents
  for select to authenticated using (is_staff());

create or replace function record_consent(p_subject text, p_channel text)
  returns void
  language sql security definer set search_path = public as $$
  insert into consents (subject, channel)
  values (nullif(p_subject,''), nullif(p_channel,''));
$$;
revoke all on function record_consent(text, text) from public;
grant execute on function record_consent(text, text) to anon, authenticated;

-- ── 3. Private backup bucket ──────────────────────────────────────────────
-- NOT public — it holds a full data export. Only the service role (the
-- db-backup Edge Function) can read/write it.
insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

-- ── 4. Daily backup cron ──────────────────────────────────────────────────
-- Mirrors the reminders cron. REPLACE the two placeholders before running.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'daily-db-backup';

select cron.schedule(
  'daily-db-backup',
  '0 19 * * *',                         -- 19:00 UTC = 00:30 IST next day
  $$
  select net.http_post(
    url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/db-backup',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer <YOUR_SUPABASE_ANON_KEY>',
                 'Content-Type',  'application/json'
               ),
    body    := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verify:   select jobname, schedule, active from cron.job where jobname='daily-db-backup';
-- Test now: select net.http_post(
--   url:='https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/db-backup',
--   headers:=jsonb_build_object('Authorization','Bearer <YOUR_SUPABASE_ANON_KEY>','Content-Type','application/json'),
--   body:='{}'::jsonb);

-- ─────────────────────────────────────────────────────────────────────────
-- RECOVERY PROCEDURE (free tier, no PITR):
--   Schema      -> the supabase/migrations/*.sql files in this repo (git).
--   Data        -> daily JSON snapshot in the private 'backups' bucket,
--                  named backup-YYYY-MM-DD.json (last 30 kept).
--   To restore:
--     1. On a fresh/empty project, run every migration in order.
--     2. Download the latest backup-*.json (Dashboard > Storage > backups,
--        or via the service role key).
--     3. For each table key in the JSON, INSERT the rows back (the file is
--        { "table": [ {row}, ... ], ... } ). Restore parents before
--        children (doctors, then appointments/patients, etc.).
--   Test this end-to-end on a throwaway project at least once.
