import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, FileText, Receipt } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Bill, BillItem, BillStatus, PayMode } from "../context/HospitalContext";
import { fmtDate, inr, todayISO, monthKey } from "../utils/formatters";
import { toast } from "sonner";

const PAY_MODES: PayMode[] = ["Cash", "UPI", "Card", "Insurance"];
const STATUSES: BillStatus[] = ["Paid", "Pending", "Partial"];

const Billing = () => {
  const { bills, patients, addBill, updateBill, deleteBill } = useHospital();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<BillItem[]>([{ name: "Doctor Fee", amount: 500 }]);
  const [payMode, setPayMode] = useState<PayMode>("Cash");
  const [status, setStatus] = useState<BillStatus>("Pending");

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterDept, setFilterDept] = useState("all");

  const filtered = useMemo(() => bills.filter((b) =>
    (filterStatus === "all" || b.status === filterStatus) &&
    (filterDate === "" || b.date === filterDate) &&
    (filterDept === "all" || b.department === filterDept)
  ), [bills, filterStatus, filterDate, filterDept]);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const monthRev = bills.filter((b) => monthKey(b.date) === monthKey(todayISO()) && b.status === "Paid").reduce((s, b) => s + b.total, 0);
  const pendingTotal = bills.filter((b) => b.status !== "Paid").reduce((s, b) => s + b.total, 0);

  const reset = () => { setPatientId(""); setItems([{ name: "Doctor Fee", amount: 500 }]); setPayMode("Cash"); setStatus("Pending"); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = patients.find((x) => x.id === patientId);
    if (!p) { toast.error("Select a patient"); return; }
    if (items.some((i) => !i.name || !i.amount)) { toast.error("Fill all line items"); return; }
    addBill({ patientId: p.id, patientName: p.name, department: p.department, date: todayISO(), items, total, status, payMode });
    toast.success("Bill generated");
    setOpen(false); reset();
  };

  const cols: Column<Bill>[] = [
    { key: "patientName", header: "Patient", render: (r) => <div><div className="font-medium text-primary-deep">{r.patientName}</div><div className="text-xs text-muted-foreground">{r.department} • {fmtDate(r.date)}</div></div> },
    { key: "items", header: "Items", render: (r) => <span className="text-xs text-muted-foreground">{r.items.length} services</span> },
    { key: "total", header: "Total", render: (r) => <span className="font-semibold">{inr(r.total)}</span> },
    { key: "payMode", header: "Mode" },
    { key: "status", header: "Status", render: (r) => {
      const tone = r.status === "Paid" ? "bg-green-100 text-green-800" : r.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-primary-soft text-primary-deep";
      return <span className={`text-xs font-semibold px-2 py-1 rounded ${tone}`}>{r.status}</span>;
    } },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button asChild size="icon" variant="ghost"><Link to={`/admin/billing/${r.id}`}><FileText className="h-4 w-4" /></Link></Button>
        {r.status !== "Paid" && <Button size="sm" variant="outline" onClick={() => { updateBill(r.id, { status: "Paid" }); toast.success("Marked paid"); }}>Mark Paid</Button>}
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Billing & Revenue" subtitle="Generate invoices and track payments."
        actions={<Button onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4 mr-1.5" />Generate Bill</Button>} />

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <StatCard label="Monthly Revenue" value={inr(monthRev)} icon={Receipt} tone="green" />
        <StatCard label="Pending Amount" value={inr(pendingTotal)} icon={Receipt} tone="amber" />
        <StatCard label="Total Bills" value={bills.length} icon={Receipt} tone="primary" />
      </div>

      <div className="rounded-2xl bg-background border border-border p-4 mb-4 shadow-card grid gap-3 sm:grid-cols-3">
        <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Department</Label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Gynecology">Gynecology</SelectItem><SelectItem value="Pediatrics">Pediatrics</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label className="text-xs">Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <DataTable columns={cols} data={filtered} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Generate Bill</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} • {p.department}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, { name: "", amount: 0 }])}><Plus className="h-3 w-3 mr-1" />Add item</Button>
              </div>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="Service / item" value={it.name} onChange={(e) => { const next = [...items]; next[i].name = e.target.value; setItems(next); }} />
                    <Input type="number" min={0} placeholder="Amount" className="w-32" value={it.amount || ""} onChange={(e) => { const next = [...items]; next[i].amount = +e.target.value; setItems(next); }} />
                    <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
              <div className="text-right font-display text-lg font-bold text-primary-deep">Total: {inr(total)}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Payment Mode</Label>
                <Select value={payMode} onValueChange={(v: PayMode) => setPayMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAY_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={status} onValueChange={(v: BillStatus) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Generate</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete bill?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteBill(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default Billing;