import type { Role } from "./context/AuthContext";

export const PAGE_ACCESS: Record<string, Role[]> = {
  dashboard: ["admin", "receptionist", "assistant"],
  patients: ["admin", "receptionist", "assistant"],
  appointments: ["admin", "receptionist"],
  beds: ["admin", "receptionist", "assistant"], // reception is view-only (handled in page)
  staff: ["admin"],
  expenses: ["admin"],
  billing: ["admin", "receptionist"],
  inventory: ["admin", "assistant"],
  reports: ["admin"],
  settings: ["admin"],
  blogPosts: ["admin"],
  messages: ["admin", "receptionist"],
};

export const can = (role: Role | undefined, page: string) =>
  !!role && (PAGE_ACCESS[page] ?? []).includes(role);