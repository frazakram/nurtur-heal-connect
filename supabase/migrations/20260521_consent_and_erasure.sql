-- DPDP right-to-erasure. Run ONCE in the SQL editor, AFTER
-- 20260520_backups_consent_ratelimit.sql (which creates the consents ledger
-- and record_consent) and 20260519 (which creates is_staff() / last10()).
--
-- Erasure anonymises a person's identifying fields by phone across the
-- public-facing tables but KEEPS the rows, so legally-required clinical and
-- billing records survive while the person is no longer identifiable.

create or replace function anonymize_patient(p_phone text)
  returns json
  language plpgsql security definer set search_path = public as $$
declare
  ph text := last10(p_phone);
  n_appt int := 0;
  n_pat  int := 0;
  n_drop int := 0;
begin
  if not is_staff() then raise exception 'not authorized'; end if;
  if ph = '' then raise exception 'a valid phone number is required'; end if;

  update appointments
     set patient_name = '[erased]', phone = '', patient_email = null
   where last10(phone) = ph;
  get diagnostics n_appt = row_count;

  update patients
     set name = '[erased]', phone = '', address = null, notes = null
   where last10(phone) = ph;
  get diagnostics n_pat = row_count;

  update booking_dropoffs
     set patient_name = '[erased]', phone = null, email = null
   where last10(phone) = ph;
  get diagnostics n_drop = row_count;

  return json_build_object(
    'appointments', n_appt, 'patients', n_pat, 'dropoffs', n_drop);
end; $$;
revoke all on function anonymize_patient(text) from public;
grant execute on function anonymize_patient(text) to authenticated;
