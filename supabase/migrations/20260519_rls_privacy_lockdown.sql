-- PRIVACY LOCKDOWN — run ONCE in the Supabase SQL editor.
--
-- Problem this fixes: the public website loads HospitalProvider, which read
-- the FULL patients / appointments / bills tables with the anon key. Anyone
-- could open browser devtools and see every patient's name, phone and visit.
--
-- This migration enforces access at the DATABASE (the only place clients
-- cannot bypass):
--   * PII tables  -> staff only (authenticated, non-patient).
--   * Public content (doctors, blog, hospital_info) -> world-readable.
--   * Public booking still works WITHOUT exposing data, via 2 SECURITY
--     DEFINER RPCs (booked-times only, and create-appointment).
--   * Patients see / change ONLY their own appointments, via 2 more RPCs
--     that derive identity from their JWT (not a client-supplied phone).
--
-- SAFE TO RE-RUN. Reversible (see the ROLLBACK block at the bottom — keep
-- it commented; run it only if the admin app loses access).

-- ── identity helpers ──────────────────────────────────────────────────────
-- Staff = a logged-in user whose role is anything other than 'patient'.
-- Legacy staff accounts with no role still count as staff, so existing
-- admin/receptionist logins keep working (mirrors AuthContext).
create or replace function is_staff() returns boolean
  language sql stable as $$
  select auth.uid() is not null
     and coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') <> 'patient';
$$;

-- Last 10 digits of any phone string ("+91 90011-18162" -> "9001118162").
create or replace function last10(p text) returns text
  language sql immutable as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10);
$$;

create or replace function jwt_phone10() returns text
  language sql stable as $$
  select last10(auth.jwt() -> 'user_metadata' ->> 'phone');
$$;

-- ── public booking RPCs (SECURITY DEFINER => bypass RLS, no PII out) ───────
-- Booked slot times for a doctor/date. Returns ONLY "HH:MM" strings.
create or replace function public_booked_slots(p_doctor uuid, p_date text)
  returns setof text
  language sql security definer set search_path = public as $$
  select substr(time::text, 1, 5)
  from appointments
  where doctor_id = p_doctor
    and date::text = p_date
    and status = 'Scheduled';
$$;

-- Create a Scheduled appointment, return its id + booking_ref. The partial
-- unique index (uniq_active_appointment_slot) still rejects double-booking;
-- the error propagates so the client shows "that slot was just taken".
create or replace function public_create_appointment(
  p_patient_name text, p_phone text, p_email text,
  p_department text, p_doctor_id uuid, p_date text, p_time text
) returns json
  language plpgsql security definer set search_path = public as $$
declare r appointments%rowtype;
begin
  insert into appointments
    (patient_name, phone, patient_email, department, doctor_id, date, time, status)
  values
    (nullif(p_patient_name,''), nullif(p_phone,''), nullif(p_email,''),
     p_department, p_doctor_id, p_date, p_time, 'Scheduled')
  returning * into r;
  return json_build_object('id', r.id, 'booking_ref', r.booking_ref);
end; $$;

-- ── patient self-service RPCs (identity from JWT, not from arguments) ──────
create or replace function patient_appointments()
  returns setof appointments
  language sql security definer set search_path = public as $$
  select * from appointments
  where jwt_phone10() <> ''
    and last10(phone) = jwt_phone10();
$$;

create or replace function patient_set_appointment(
  p_id uuid, p_status text default null,
  p_date text default null, p_time text default null
) returns boolean
  language plpgsql security definer set search_path = public as $$
declare owns boolean;
begin
  select jwt_phone10() <> '' and last10(phone) = jwt_phone10()
    into owns from appointments where id = p_id;
  if not coalesce(owns, false) then return false; end if;
  update appointments set
    status = coalesce(p_status, status),
    date   = coalesce(p_date, date),
    time   = coalesce(p_time, time)
  where id = p_id;
  return true;
end; $$;

revoke all on function public_booked_slots(uuid, text)        from public;
revoke all on function public_create_appointment(text,text,text,text,uuid,text,text) from public;
revoke all on function patient_appointments()                 from public;
revoke all on function patient_set_appointment(uuid,text,text,text) from public;
grant execute on function public_booked_slots(uuid, text)        to anon, authenticated;
grant execute on function public_create_appointment(text,text,text,text,uuid,text,text) to anon, authenticated;
grant execute on function patient_appointments()                 to authenticated;
grant execute on function patient_set_appointment(uuid,text,text,text) to authenticated;

-- ── RLS: PII tables -> staff only ─────────────────────────────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'appointments','patients','bills','expenses','beds','staff','inventory'
  ] loop
    execute format('alter table %I enable row level security;', tbl);
    execute format('drop policy if exists %I on %I;', tbl||'_staff_all', tbl);
    execute format(
      'create policy %I on %I for all to authenticated using (is_staff()) with check (is_staff());',
      tbl||'_staff_all', tbl);
  end loop;
end $$;

-- ── RLS: public-readable content (anon read; staff write) ─────────────────
do $$
declare tbl text;
begin
  foreach tbl in array array['doctors','blog_posts','hospital_info'] loop
    execute format('alter table %I enable row level security;', tbl);
    execute format('drop policy if exists %I on %I;', tbl||'_public_read', tbl);
    execute format('drop policy if exists %I on %I;', tbl||'_staff_write', tbl);
    execute format(
      'create policy %I on %I for select using (true);', tbl||'_public_read', tbl);
    execute format(
      'create policy %I on %I for all to authenticated using (is_staff()) with check (is_staff());',
      tbl||'_staff_write', tbl);
  end loop;
end $$;

-- ── RLS: messages (contact form) — anyone may send, staff may read ────────
alter table messages enable row level security;
drop policy if exists messages_public_insert on messages;
drop policy if exists messages_staff_all     on messages;
create policy messages_public_insert on messages
  for insert to anon, authenticated with check (true);
create policy messages_staff_all on messages
  for all to authenticated using (is_staff()) with check (is_staff());

-- ── RLS: tighten booking_dropoffs select to staff (was any authenticated) ─
drop policy if exists dropoffs_auth_select on booking_dropoffs;
create policy dropoffs_auth_select on booking_dropoffs
  for select to authenticated using (is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- ROLLBACK (uncomment & run ONLY if the admin app loses data access):
--   do $$ declare tbl text; begin
--     foreach tbl in array array['appointments','patients','bills','expenses',
--       'beds','staff','inventory','doctors','blog_posts','hospital_info',
--       'messages'] loop
--       execute format('alter table %I disable row level security;', tbl);
--     end loop; end $$;
