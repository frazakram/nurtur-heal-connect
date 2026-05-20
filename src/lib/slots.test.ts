import { describe, it, expect, vi, beforeEach } from "vitest";

// supabase is mocked so getAvailableSlots can be tested without a backend.
const rpc = vi.fn();
vi.mock("./supabase", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));

import {
  label12, scheduledSlots, getAvailableSlots,
  MORNING_SLOTS, EVENING_SLOTS, ALL_SLOTS,
} from "./slots";
import type { WeekSchedule } from "../admin/context/HospitalContext";

// 2024-01-07 is a Sunday, 2024-01-08 a Monday (stable, far-future-safe dates).
const SUNDAY = "2024-01-07";
const MONDAY = "2024-01-08";

describe("label12 (24h -> 12h)", () => {
  it.each([
    ["00:00", "12:00 AM"],
    ["12:00", "12:00 PM"],
    ["09:05", "9:05 AM"],
    ["13:30", "1:30 PM"],
    ["20:00", "8:00 PM"],
  ])("%s -> %s", (input, expected) => {
    expect(label12(input)).toBe(expected);
  });
});

describe("scheduledSlots", () => {
  it("no schedule: Mon–Sat = all slots, Sunday = closed", () => {
    expect(scheduledSlots(null, MONDAY)).toEqual(ALL_SLOTS);
    expect(scheduledSlots(null, SUNDAY)).toEqual([]);
  });

  it("honors a per-day morning/evening schedule", () => {
    const morningOnly = {
      mon: { morning: true, evening: false },
    } as unknown as WeekSchedule;
    expect(scheduledSlots(morningOnly, MONDAY)).toEqual(MORNING_SLOTS);

    const eveningOnly = {
      mon: { morning: false, evening: true },
    } as unknown as WeekSchedule;
    expect(scheduledSlots(eveningOnly, MONDAY)).toEqual(EVENING_SLOTS);

    const dayOff = {
      mon: { morning: false, evening: false },
    } as unknown as WeekSchedule;
    expect(scheduledSlots(dayOff, MONDAY)).toEqual([]);
  });
});

describe("getAvailableSlots", () => {
  beforeEach(() => rpc.mockReset());

  it("removes already-booked times (future date, no schedule)", async () => {
    rpc.mockResolvedValue({ data: ["09:00", "09:30:00"] });
    const out = await getAvailableSlots("doc-1", "2099-01-04"); // far-future Monday
    expect(rpc).toHaveBeenCalledWith("public_booked_slots", {
      p_doctor: "doc-1",
      p_date: "2099-01-04",
    });
    expect(out).not.toContain("09:00");
    expect(out).not.toContain("09:30");
    expect(out).toContain("10:00");
  });

  it("returns [] when the doctor does not work that day", async () => {
    rpc.mockResolvedValue({ data: [] });
    const out = await getAvailableSlots("doc-1", "2099-01-03"); // far-future Sunday
    expect(out).toEqual([]);
  });
});
