import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, CalendarDays, List } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Appointment, AppointmentStatus, Department } from "../context/HospitalContext";
import { fmtDate, todayISO } from "../utils/formatters";
import { toast } from "sonner";

const empty: Omit<Appointment, "id" | "status"> = {
  patientName: "", phone: "", doctor: "", department: "Gynecology", date: todayISO(), time: "10:00",
};

const StatusPill = ({ s }: { s: AppointmentStatus }) => {
  const tone = s === "Scheduled" ? "bg-primary-soft text-primary-deep" : s === "Completed" ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800";
  return <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{s}</span>;
};

const Appointments = () => {
  const { appointments, staff, addAppointment, updateAppointment, deleteAppointment } = useHospital();
  const doctors = staff.filter((s) => s.role === "Doctor");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [doctor, setDoctor] = useState("all");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => appointments.filter((a) =>
    (date === "" || a.date === date) &&
    (doctor === "all" || a.doctor === doctor) &&
    (dept === "all" || a.department === dept) &&
    (status === "all" || a.status === status)
  ), [appointments, date, doctor, dept, status]);

  const openNew = () => { setEditing(null); setForm({ ...empty, doctor: doctors[0]?.name ?? "" }); setOpen(true); };
  const openEdit = (a: Appointment) => { setEditing(a); setForm(a); setOpen(true); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientName || !form.phone || !form.doctor) { toast.error("Please fill all required fields"); return; }
    if (editing) { updateAppointment(editing.id, form); toast.success("Appointment updated"); }
    else { addAppointment(form); toast.success("Appointment created"); }
    setOpen(false);
  };

  const cols: Column<Appointment>[] = [
    { key: "patientName", header: "Patient", render: (r) => <div><div className="font-medium text-primary-deep">{r.patientName}</div><div className="text-xs text-muted-foreground">{r.phone}</div></div> },
    { key: "doctor", header: "Doctor" },
    { key: "department", header: "Department" },
    { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
    { key: "time", header: "Time" },
    { key: "status", header: "Status", render: (r) => <StatusPill s={r.status} /> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        {r.status === "Scheduled" && <Button size="icon" variant="ghost" onClick={() => { updateAppointment(r.id, { status: "Completed" }); toast.success("Marked completed"); }}><CheckCircle className="h-4 w-4 text-green-600" /></Button>}
        {r.status === "Scheduled" && <Button size="icon" variant="ghost" onClick={() => { updateAppointment(r.id, { status: "Cancelled" }); toast.success("Cancelled"); }}><XCircle className="h-4 w-4 text-amber-600" /></Button>}
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  // Calendar (current month grid)
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < monthStart.getDay(); i++) days.push(null);
  for (let d = 1; d <= monthEnd.getDate(); d++) days.push(new Date(today.getFullYear(), today.getMonth(), d));

  return (
    <>
      <PageHeader title="Appointments" subtitle="Schedule and manage patient appointments."
        actions={
          <>
            <div className="rounded-lg border border-border bg-background p-1 flex">
              <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")}><List className="h-4 w-4 mr-1" />List</Button>
              <Button variant={view === "calendar" ? "default" : "ghost"} size="sm" onClick={() => setView("calendar")}><CalendarDays className="h-4 w-4 mr-1" />Calendar</Button>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Appointment</Button>
          </>
        }
      />

      <div className="rounded-2xl bg-background border border-border p-4 mb-4 shadow-card grid gap-3 sm:grid-cols-4">
        <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="space-y-1">
          <Label className="text-xs">Doctor</Label>
          <Select value={doctor} onValueChange={setDoctor}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{doctors.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Gynecology">Gynecology</SelectItem><SelectItem value="Pediatrics">Pediatrics</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Cancelled">Cancelled</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {view === "list" ? (
        <DataTable columns={cols} data={filtered} />
      ) : (
        <div className="rounded-2xl bg-background border border-border p-5 shadow-card">
          <div className="font-display font-bold text-primary-deep mb-4">{today.toLocaleString("en-IN", { month: "long", year: "numeric" })}</div>
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const iso = d.toISOString().slice(0, 10);
              const list = appointments.filter((a) => a.date === iso);
              const isToday = iso === todayISO();
              return (
                <div key={i} className={`min-h-24 rounded-lg border p-2 ${isToday ? "border-primary bg-primary-soft/40" : "border-border bg-background"}`}>
                  <div className="text-xs font-semibold text-foreground/70">{d.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {list.slice(0, 2).map((a) => (
                      <div key={a.id} className="truncate text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground/80">{a.time} {a.patientName}</div>
                    ))}
                    {list.length > 2 && <div className="text-[10px] text-muted-foreground">+{list.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Appointment" : "New Appointment"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Patient Name</Label><Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v: Department) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Gynecology">Gynecology</SelectItem><SelectItem value="Pediatrics">Pediatrics</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Doctor</Label>
              <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete appointment?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteAppointment(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default Appointments;