import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, HeartPulse, ShieldCheck } from "lucide-react";
import { AppointmentModal } from "@/components/AppointmentModal";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/portal", label: "Patient Portal" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-deep">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-soft">
            <HeartPulse className="h-5 w-5" />
          </span>
          Care Hospital
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-primary-deep",
                  isActive ? "text-primary-deep bg-primary-soft" : "text-foreground/70"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <Link to="/admin/login" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground/70 hover:text-primary-deep hover:border-primary transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" /> Staff Login
          </Link>
          <AppointmentModal />
        </div>
        <button
          className="lg:hidden rounded-lg p-2 hover:bg-secondary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container flex flex-col py-4 gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "text-primary-deep bg-primary-soft" : "text-foreground/80"
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/admin/login" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground/70">
                <ShieldCheck className="h-4 w-4" /> Staff Login
              </Link>
              <AppointmentModal />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};