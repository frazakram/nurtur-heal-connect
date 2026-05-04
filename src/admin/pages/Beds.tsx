import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, BedDouble } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Bed, BedStatus, Ward } from "../context/HospitalContext";
import { useAuth } from "../context/AuthContext";
import { fmtDate } from "../utils/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WARDS: Ward[] = ["General Ward (Gynecology)", "Maternity Ward", "Pediatrics Ward", "NICU", "Private Rooms"];

const Beds = () => {
  const { user } = useAuth();
  const readOnly = user?.role === "receptionist";
  const { beds, patients, addBed, updateBed, deleteBed, assignBed, releaseBed } = useHospital();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bed | null>(null);
  const [form, setForm] = useState<{ number: string; ward: Ward }>({ number: "", ward: "General Ward (Gynecology)" });
  const [confirm, setConfirm] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<Bed | null>(null);
  const [assignPatient, setAssignPatient] = useState("");

  const summary = useMemo(() => ({
    total: beds.length,
    occupied: beds.filter((b) => b.status === "Occupied").length,
    available: beds.filter((b) => b.status === "Available").length,
    maintenance: beds.filter((b) => b.status === "Maintenance").length,
  }), [beds]);

  const grouped = WARDS.map((w) => ({ ward: w, beds: beds.filter((b) => b.ward === w) }));

  const openNew = () => { setEditing(null); setForm({ number: "", ward: "General Ward (Gynecology)" }); setOpen(true); };
  const openEdit = (b: Bed) => { setEditing(b); setForm({ number: b.number, ward: b.ward }); setOpen(true); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number) return;
    if (editing) { updateBed(editing.id, form); toast.success("Bed updated"); }
    else { addBed(form); toast.success("Bed added"); }
    setOpen(false);
  };

  const ipdPatients = patients.filter((p) => p.type === "IPD" && p.status !== "Discharged");

  const STATUS_STYLE: Record<BedStatus, string> = {
    Available: "bg-green-50 border-green-200",
    Occupied: "bg-rose-50 border-rose-200",
    Maintenance: "bg-amber-50 border-amber-200",
  };
  const DOT: Record<BedStatus, string> = { Available: "bg-green-500", Occupied: "bg-rose-500", Maintenance: "bg-amber-500" };

  return (
    <>
      <PageHeader title="Beds & Wards" subtitle={readOnly ? "View bed availability across wards." : "Manage hospital bed assignments and ward inventory."}
        actions={!readOnly && <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Bed</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total Beds" value={summary.total} icon={BedDouble} tone="primary" />
        <StatCard label="Occupied" value={summary.occupied} icon={BedDouble} tone="rose" />
        <StatCard label="Available" value={summary.available} icon={BedDouble} tone="green" />
        <StatCard label="Maintenance" value={summary.maintenance} icon={BedDouble} tone="amber" />
      </div>

      <div className="space-y-6">
        {grouped.map(({ ward, beds: wb }) => (
          <div key={ward} className="rounded-2xl bg-background border border-border p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-primary-deep">{ward}</h3>
              <span className="text-xs text-muted-foreground">{wb.length} beds</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {wb.map((b) => (
                <div key={b.id} className={cn("rounded-xl border p-4", STATUS_STYLE[b.status])}>
                  <div className="flex items-center justify-between">
                    <div className="font-display font-bold text-primary-deep">{b.number}</div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className={cn("h-2 w-2 rounded-full", DOT[b.status])} /> {b.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground min-h-8">
                    {b.status === "Occupied" ? <>{b.patientName}<br />Admitted {fmtDate(b.admissionDate ?? "")}</> : b.status === "Maintenance" ? "Under maintenance" : "Available for assignment"}
                  </div>
                  {!readOnly && (
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {b.status === "Available" && <Button size="sm" variant="outline" onClick={() => { setAssignFor(b); setAssignPatient(""); }}>Assign</Button>}
                      {b.status === "Occupied" && <Button size="sm" variant="outline" onClick={() => { releaseBed(b.id); toast.success("Bed released"); }}>Release</Button>}
                      {b.status !== "Occupied" && <Button size="sm" variant="outline" onClick={() => updateBed(b.id, { status: b.status === "Maintenance" ? "Available" : "Maintenance" })}>{b.status === "Maintenance" ? "Mark OK" : "Maintenance"}</Button>}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirm(b.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Bed" : "Add Bed"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Bed Number</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Ward</Label>
              <Select value={form.ward} onValueChange={(v: Ward) => setForm({ ...form, ward: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Patient to {assignFor?.number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assignPatient} onValueChange={setAssignPatient}>
              <SelectTrigger><SelectValue placeholder="Select admitted IPD patient" /></SelectTrigger>
              <SelectContent>
                {ipdPatients.length === 0 && <div className="p-3 text-sm text-muted-foreground">No IPD patients available.</div>}
                {ipdPatients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} • {p.department}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignFor(null)}>Cancel</Button>
              <Button onClick={() => { if (assignFor && assignPatient) { assignBed(assignFor.id, assignPatient); toast.success("Bed assigned"); setAssignFor(null); } }}>Assign</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete bed?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteBed(confirm); toast.success("Bed deleted"); } }} />
    </>
  );
};

export default Beds;