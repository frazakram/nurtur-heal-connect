import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Patient, Department, PatientStatus } from "../context/HospitalContext";
import { fmtDate, todayISO } from "../utils/formatters";
import { toast } from "sonner";

const empty: Omit<Patient, "id" | "status"> = {
  name: "", age: 0, gender: "Female", phone: "", address: "",
  department: "Gynecology", doctor: "", type: "OPD", admissionDate: todayISO(), notes: "", bedId: null,
};

const Patients = () => {
  const { patients, staff, addPatient, updatePatient, deletePatient } = useHospital();
  const doctors = staff.filter((s) => s.role === "Doctor");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => patients.filter((p) =>
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q)) &&
    (dept === "all" || p.department === dept) &&
    (status === "all" || p.status === status)
  ), [patients, q, dept, status]);

  const openNew = () => { setEditing(null); setForm({ ...empty, doctor: doctors[0]?.name ?? "" }); setOpen(true); };
  const openEdit = (p: Patient) => { setEditing(p); setForm(p); setOpen(true); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.doctor) { toast.error("Name, phone and doctor are required"); return; }
    if (editing) {
      updatePatient(editing.id, { ...form, status: form.type === "IPD" ? (editing.status === "Discharged" ? "Discharged" : "IPD") : "OPD" } as Partial<Patient>);
      toast.success("Patient updated");
    } else {
      addPatient(form);
      toast.success("Patient added");
    }
    setOpen(false);
  };

  const cols: Column<Patient>[] = [
    { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">#{r.id.slice(0, 6).toUpperCase()}</span> },
    { key: "name", header: "Name", render: (r) => <div className="font-medium text-primary-deep">{r.name}</div> },
    { key: "age", header: "Age", render: (r) => `${r.age} / ${r.gender[0]}` },
    { key: "department", header: "Department", render: (r) => (
      <span className={`text-xs font-semibold px-2 py-1 rounded ${r.department === "Gynecology" ? "bg-gyn text-gyn-foreground" : "bg-peds text-peds-foreground"}`}>{r.department}</span>
    ) },
    { key: "doctor", header: "Doctor" },
    { key: "admissionDate", header: "Admitted", render: (r) => fmtDate(r.admissionDate) },
    { key: "status", header: "Status", render: (r) => {
      const tone = r.status === "Discharged" ? "bg-secondary text-foreground/70" : r.status === "IPD" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";
      return <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{r.status}</span>;
    } },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button asChild size="icon" variant="ghost"><Link to={`/admin/patients/${r.id}`}><Eye className="h-4 w-4" /></Link></Button>
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Patient Management" subtitle="Manage OPD and IPD patient records."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Patient</Button>} />

      <div className="rounded-2xl bg-background border border-border p-4 mb-4 shadow-card grid gap-3 sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone…" className="pl-9" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Gynecology">Gynecology</SelectItem>
            <SelectItem value="Pediatrics">Pediatrics</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPD">OPD</SelectItem>
            <SelectItem value="IPD">IPD</SelectItem>
            <SelectItem value="Discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={cols} data={filtered} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Patient" : "Add New Patient"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" min={0} value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v: any) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v: Department) => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Gynecology">Gynecology</SelectItem><SelectItem value="Pediatrics">Pediatrics</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned Doctor</Label>
              <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>{doctors.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="OPD">OPD</SelectItem><SelectItem value="IPD">IPD</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Admission Date</Label><Input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            {editing && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Status</Label>
                <Select value={(form as any).status ?? editing.status} onValueChange={(v: PatientStatus) => setForm({ ...(form as any), status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="OPD">OPD</SelectItem><SelectItem value="IPD">IPD</SelectItem><SelectItem value="Discharged">Discharged</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Add patient"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete patient?" description="This will remove the patient and free their bed." onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deletePatient(confirm); toast.success("Patient deleted"); } }} />
    </>
  );
};

export default Patients;