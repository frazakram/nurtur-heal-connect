import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CalendarDays, BedDouble, UserCog, Wallet,
  Receipt, Package, BarChart3, Settings as SettingsIcon, HeartPulse, X, MessageSquare
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { can } from "../access";
import { cn } from "@/lib/utils";
import { supabase } from "../../lib/supabase";

const items = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { to: "/admin/patients", label: "Patients", icon: Users, key: "patients" },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarDays, key: "appointments" },
  { to: "/admin/beds", label: "Beds & Wards", icon: BedDouble, key: "beds" },
  { to: "/admin/staff", label: "Staff", icon: UserCog, key: "staff" },
  { to: "/admin/expenses", label: "Expenses", icon: Wallet, key: "expenses" },
  { to: "/admin/billing", label: "Billing", icon: Receipt, key: "billing" },
  { to: "/admin/inventory", label: "Inventory", icon: Package, key: "inventory" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, key: "reports" },
  { to: "/admin/blog-admin", label: "Blog", icon: HeartPulse, key: "blogPosts" },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare, key: "messages" },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon, key: "settings" },
];

interface Props { open: boolean; onClose: () => void; }

export const Sidebar = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const visible = items.filter((i) => can(user?.role, i.key));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false)
      .then(({ count }) => setUnreadCount(count || 0));
  }, []);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-[hsl(201_96%_22%)] text-white flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><HeartPulse className="h-5 w-5" /></span>
            Care HMS
          </div>
          <button className="lg:hidden p-1" onClick={onClose} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visible.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors justify-between",
                  isActive ? "bg-white text-[hsl(201_96%_22%)] shadow-soft" : "text-white/80 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <div className="flex items-center gap-3">
                <it.icon className="h-4 w-4" /> {it.label}
              </div>
              {it.key === "messages" && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10 text-xs text-white/60">
          v1.0 • Internal use only
        </div>
      </aside>
    </>
  );
};