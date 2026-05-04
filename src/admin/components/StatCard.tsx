import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "gyn" | "peds" | "green" | "amber" | "rose";
  hint?: string;
}

const TONE: Record<string, string> = {
  primary: "bg-primary-soft text-primary-deep",
  gyn: "bg-gyn text-gyn-foreground",
  peds: "bg-peds text-peds-foreground",
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
};

export const StatCard = ({ label, value, icon: Icon, tone = "primary", hint }: Props) => (
  <div className="rounded-2xl bg-background border border-border p-5 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 font-display text-2xl font-bold text-primary-deep">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
      <div className={cn("grid h-11 w-11 place-items-center rounded-xl", TONE[tone])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);