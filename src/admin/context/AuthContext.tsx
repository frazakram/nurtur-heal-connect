import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../../lib/supabase";

export type Role = "admin" | "receptionist" | "assistant";

export interface AuthUser {
  email: string;
  name: string;
  role: Role;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const STAFF_ROLES: Role[] = ["admin", "receptionist", "assistant"];

// The patient portal and the admin app share one Supabase auth session, so a
// portal patient's session also reaches this provider. Only treat a session
// as staff if it isn't a patient. Legacy/no-role staff accounts still default
// to admin so existing logins keep working; explicit 'patient' is rejected.
const toStaffUser = (u: {
  email?: string;
  user_metadata?: { name?: string; role?: string };
}): AuthUser | null => {
  const raw = u.user_metadata?.role;
  if (raw === "patient") return null;
  const role: Role = STAFF_ROLES.includes(raw as Role) ? (raw as Role) : "admin";
  return {
    email: u.email || "",
    name: u.user_metadata?.name || u.email?.split("@")[0] || "User",
    role,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? toStaffUser(session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toStaffUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    const authUser = toStaffUser(data.user);
    if (!authUser) {
      await supabase.auth.signOut();
      return { ok: false, error: "This account is not a staff account." };
    }
    setUser(authUser);
    return { ok: true, user: authUser };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};