import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { storage } from "../utils/storage";

export type Role = "admin" | "receptionist" | "assistant";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
}

const CREDS: Record<string, { password: string; user: AuthUser }> = {
  "admin@carehospital.in": { password: "admin123", user: { email: "admin@carehospital.in", name: "Dr. Admin", role: "admin" } },
  "reception@carehospital.in": { password: "recep123", user: { email: "reception@carehospital.in", name: "Reception Desk", role: "receptionist" } },
  "assistant@carehospital.in": { password: "assist123", user: { email: "assistant@carehospital.in", name: "Medical Assistant", role: "assistant" } },
};

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string; user?: AuthUser };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "ch_auth_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(storage.get<AuthUser | null>(KEY, null));
  }, []);

  const login = (email: string, password: string) => {
    const entry = CREDS[email.trim().toLowerCase()];
    if (!entry || entry.password !== password) return { ok: false, error: "Invalid email or password" };
    storage.set(KEY, entry.user);
    setUser(entry.user);
    return { ok: true, user: entry.user };
  };

  const logout = () => {
    storage.remove(KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};