import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Staff as StaffType, StaffRole, Shift } from "../context/HospitalContext";
import { fmtDate, todayISO } from "../utils/formatters";
import { toast } from "sonner";

const ROLES: StaffRole[] = ["Doctor", "Nurse", "Receptionist", "Medical Assistant", "Lab Technician"];
const SHIFTS: Shift[] = ["Morning", "Evening", "Night"];

const empty: Omit<StaffType, "id" | "active"> = {
  name: "", role: "Doctor", department: "Gynecology", qualification: "", phone: "", email: "", shift: "Morning", joiningDate: todayISO(),
};

const Staff = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useHospital();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffType | null>(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: StaffType) => { setEditing(s); setForm(s); setOpen(true); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    if (editing) { updateStaff(editing.id, form); toast.success("Staff updated"); }
    else { addStaff(form); toast.success("Staff added"); }
    setOpen(false);
  };

  const cols: Column<StaffType>[] = [
    { key: "name", header: "Name", render: (r) => <div className="font-medium text-primary-deep">{r.name}</div> },
    { key: "role", header: "Role" },
    { key: "department", header: "Department" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email", render: (r) => <span className="text-xs">{r.email}</span> },
    { key: "shift", header: "Shift" },
    { key: "active", header: "Status", render: (r) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded ${r.active ? "bg-green-100 text-green-800" : "bg-secondary text-muted-foreground"}`}>{r.active ? "Active" : "Off"}</span>
    ) },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => updateStaff(r.id, { active: !r.active })}><Power className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  const doctors = staff.filter((s) => s.role === "Doctor");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const shiftHours: Record<Shift, string> = { Morning: "08:00–14:00", Evening: "14:00–20:00", Night: "20:00–08:00" };

  return (
    <>
      <PageHeader title="Doctor & Staff Management" subtitle="Manage hospital staff, roles and shifts."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Staff</Button>} />

      <DataTable columns={cols} data={staff} />

      <div className="mt-6 rounded-2xl bg-background border border-border p-5 shadow-card">
        <h3 className="font-display font-bold text-primary-deep mb-4">Doctor Schedule</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr><th className="text-left px-3 py-2 font-semibold">Doctor</th>{days.map((d) => <th key={d} className="text-left px-3 py-2 font-semibold">{d}</th>)}</tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-primary-deep">{d.name}<div className="text-xs text-muted-foreground">{d.department}</div></td>
                  {days.map((day) => (
                    <td key={day} className="px-3 py-2"><span className="text-xs px-2 py-1 rounded bg-primary-soft text-primary-deep font-medium">{d.shift} • {shiftHours[d.shift]}</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Staff" : "Add Staff"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v: StaffRole) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Qualification</Label><Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={form.shift} onValueChange={(v: Shift) => setForm({ ...form, shift: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{SHIFTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add staff"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete staff?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteStaff(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default Staff;