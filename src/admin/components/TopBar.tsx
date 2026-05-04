import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { useHospital } from "../context/HospitalContext";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  receptionist: "Receptionist",
  assistant: "Medical Assistant",
};

export const TopBar = ({ onMenu }: { onMenu: () => void }) => {
  const { user, logout } = useAuth();
  const { info } = useHospital();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <button className="lg:hidden p-2 rounded-lg hover:bg-secondary" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <div className="font-display font-bold text-primary-deep truncate">{info.name}</div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:block text-right leading-tight">
          <div className="text-sm font-semibold text-foreground">{user?.name}</div>
          <div className="text-xs text-muted-foreground">{user ? ROLE_LABEL[user.role] : ""}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-primary-foreground font-bold">
          {user?.name?.[0] ?? "U"}
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1.5" /> Logout
        </Button>
      </div>
    </header>
  );
};