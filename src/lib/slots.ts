import { supabase } from "./supabase";
import type { WeekSchedule, DayKey } from "../admin/context/HospitalContext";

// 30-min slots. Stored as 24h "HH:MM" everywhere (modal, chatbot, admin,
// email functions). Morning / evening split lets us honor a doctor's
// per-day OPD schedule (doctors.schedule JSONB).
export const MORNING_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00",
];
export const EVENING_SLOTS = [
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
];
export const ALL_SLOTS = [...MORNING_SLOTS, ...EVENING_SLOTS];

// JS Date.getDay(): 0=Sun … 6=Sat
const DAY_KEYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const label12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Normalize a DB time value to "HH:MM" — the column may come back as
// "09:00", "09:00:00" (Postgres time type), so trim to first 5 chars.
const hhmm = (t: unknown) => String(t ?? "").slice(0, 5);

/**
 * Slots a doctor theoretically works on a given date, per their weekly
 * schedule. If no schedule is set, fall back to the legacy behavior:
 * Mon–Sat all slots, Sunday closed.
 */
export function scheduledSlots(
  schedule: WeekSchedule | null | undefined,
  dateISO: string,
): string[] {
  const dow = new Date(dateISO + "T12:00:00").getDay();
  if (!schedule) return dow === 0 ? [] : ALL_SLOTS;

  const day = schedule[DAY_KEYS[dow]];
  if (!day) return [];

  const slots: string[] = [];
  if (day.morning) slots.push(...MORNING_SLOTS);
  if (day.evening) slots.push(...EVENING_SLOTS);
  return slots;
}

/**
 * Real bookable slots for a doctor on a date: scheduled slots minus
 * already-booked (status = Scheduled) minus past times if the date is today.
 * Optionally exclude an appointment id (so a reschedule doesn't collide
 * with its own current slot).
 */
export async function getAvailableSlots(
  doctorId: string,
  dateISO: string,
  schedule?: WeekSchedule | null,
  excludeAppointmentId?: string,
): Promise<string[]> {
  const base = scheduledSlots(schedule, dateISO);
  if (base.length === 0) return [];

  const { data } = await supabase
    .from("appointments")
    .select("id, time")
    .eq("doctor_id", doctorId)
    .eq("date", dateISO)
    .eq("status", "Scheduled");

  const booked = new Set(
    (data || [])
      .filter((a: { id: string }) => a.id !== excludeAppointmentId)
      .map((a: { time: string }) => hhmm(a.time)),
  );

  const now = new Date();
  const isToday = dateISO === todayISO();

  return base.filter((slot) => {
    if (booked.has(slot)) return false;
    if (isToday) {
      const [h, m] = slot.split(":").map(Number);
      const st = new Date();
      st.setHours(h, m, 0, 0);
      return st > now;
    }
    return true;
  });
}
