-- Schedule the multi-window appointment reminder function to run daily.
-- Run ONCE in the Supabase SQL editor, after editing the two placeholders below.
--
-- Reminders fire 7 days before and 1 day before each Scheduled appointment.
-- The function is idempotent (per-window *_sent flags), so running it more
-- than once a day is SAFE and never double-sends — it only makes the job
-- more resilient if a single run fails. Daily is the minimum.

-- 1. Required extensions (enable once; no-op if already enabled).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Remove any previous copy of this job so this script is re-runnable.
select cron.unschedule(jobid)
from cron.job
where jobname = 'daily-appointment-reminders';

-- 3. Schedule it. Cron runs in UTC. '30 3 * * *' = 03:30 UTC = 09:00 AM IST.
--    The function does its own IST date math, so just pick a stable daily
--    time (mid-morning IST recommended). Adjust the cron expression freely.
--
--    REPLACE BEFORE RUNNING:
--      <YOUR_PROJECT_REF>      Supabase dashboard → Project Settings → General
--      <YOUR_SUPABASE_ANON_KEY> Supabase dashboard → Project Settings → API
select cron.schedule(
  'daily-appointment-reminders',
  '30 3 * * *',
  $$
  select net.http_post(
    url     := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-appointment-reminders',
    headers := jsonb_build_object(
                 'Authorization', 'Bearer <YOUR_SUPABASE_ANON_KEY>',
                 'Content-Type',  'application/json'
               ),
    body    := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verify it registered:
--   select jobname, schedule, active from cron.job where jobname = 'daily-appointment-reminders';
-- Trigger a manual test run without waiting for the schedule:
--   select net.http_post(
--     url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-appointment-reminders',
--     headers := jsonb_build_object('Authorization','Bearer <YOUR_SUPABASE_ANON_KEY>','Content-Type','application/json'),
--     body := '{}'::jsonb);
