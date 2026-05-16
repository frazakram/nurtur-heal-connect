import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { Phone, MessageCircle, Trash2, CheckCircle, XCircle } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatCard } from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fmtDateTime } from "../utils/formatters";
import { label12 } from "@/lib/slots";

interface Dropoff {
  id: string;
  sessionId: string;
  stage: string;
  patientName: string;
  phone: string;
  email: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: string;
  source: string;
  updatedAt: string;
}

interface DropoffRow {
  id: string;
  session_id: string;
  stage: string | null;
  patient_name: string | null;
  phone: string | null;
  email: string | null;
  doctor_name: string | null;
  department: string | null;
  date: string | null;
  time: string | null;
  status: string | null;
  source: string | null;
  updated_at: string | null;
}

const STAGE_LABEL: Record<string, string> = {
  started: "Started",
  contact: "Gave contact",
  doctor: "Chose doctor",
  date: "Chose date",
  confirm: "Reached confirm",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  recovered: "bg-green-100 text-green-800",
  dismissed: "bg-secondary text-muted-foreground",
  booked: "bg-primary-soft text-primary-deep",
};

const waLink = (phone: string) => {
  const d = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${d.length === 10 ? "91" + d : d}`;
};

const Followups = () => {
  const [rows, setRows] = useState<Dropoff[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("booking_dropoffs")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setRows((data as DropoffRow[]).map((r) => ({
        id: r.id, sessionId: r.session_id, stage: r.stage || "started",
        patientName: r.patient_name || "", phone: r.phone || "", email: r.email || "",
        doctorName: r.doctor_name || "", department: r.department || "",
        date: r.date || "", time: r.time || "", status: r.status || "open",
        source: r.source || "chatbot", updatedAt: r.updated_at || "",
      })));
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );
  const openCount = useMemo(() => rows.filter((r) => r.status === "open").length, [rows]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("booking_dropoffs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Marked ${status}`);
    } else {
      toast.error("Update failed");
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("booking_dropoffs").delete().eq("id", id);
    if (!error) {
      setRows((rs) => rs.filter((r) => r.id !== id));
      toast.success("Deleted");
    } else {
      toast.error("Delete failed");
    }
  };

  const cols: Column<Dropoff>[] = [
    {
      key: "patientName", header: "Lead", render: (r) => (
        <div>
          <div className="font-medium text-primary-deep">{r.patientName || "—"}</div>
          <div className="text-xs text-muted-foreground">{r.phone || r.email || "no contact"}</div>
        </div>
      ),
    },
    {
      key: "stage", header: "Progress", render: (r) => (
        <div>
          <div className="text-sm">{STAGE_LABEL[r.stage] || r.stage}</div>
          {(r.doctorName || r.date) && (
            <div className="text-xs text-muted-foreground">
              {[r.doctorName, r.date && `${r.date}${r.time ? " " + label12(r.time) : ""}`].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
      ),
    },
    { key: "updatedAt", header: "Last activity", render: (r) => <span className="text-sm text-muted-foreground">{fmtDateTime(r.updatedAt)}</span> },
    {
      key: "status", header: "Status", render: (r) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_TONE[r.status] || "bg-secondary"}`}>{r.status}</span>
      ),
    },
    {
      key: "actions", header: "", className: "text-right", render: (r) => (
        <div className="flex justify-end gap-1">
          {r.phone && (
            <>
              <Button asChild size="icon" variant="ghost" title="Call">
                <a href={`tel:${r.phone.replace(/[^0-9+]/g, "")}`}><Phone className="h-4 w-4" /></a>
              </Button>
              <Button asChild size="icon" variant="ghost" title="WhatsApp">
                <a href={waLink(r.phone)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-green-600" /></a>
              </Button>
            </>
          )}
          {r.status === "open" && (
            <>
              <Button size="icon" variant="ghost" title="Mark recovered" onClick={() => setStatus(r.id, "recovered")}>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" title="Dismiss" onClick={() => setStatus(r.id, "dismissed")}>
                <XCircle className="h-4 w-4 text-amber-600" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" title="Delete" onClick={() => setConfirmDeleteId(r.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Patients who started booking but didn't finish — call them back." />

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <StatCard label="Open follow-ups" value={openCount} icon={Phone} tone="amber" />
      </div>

      <div className="rounded-2xl bg-background border border-border p-4 mb-4 shadow-card flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Show</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="recovered">Recovered</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl bg-background border border-border shadow-sm overflow-hidden">
        <DataTable columns={cols} data={filtered} />
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete this lead?"
        description="This permanently removes the drop-off record."
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) remove(confirmDeleteId); }}
      />
    </>
  );
};

export default Followups;
