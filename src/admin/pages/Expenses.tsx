import { useMemo, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, Expense, ExpenseCategory } from "../context/HospitalContext";
import { fmtDate, inr, todayISO, monthKey } from "../utils/formatters";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Wallet } from "lucide-react";

const CATS: ExpenseCategory[] = ["Medicines", "Equipment", "Salary", "Utilities", "Housekeeping", "Lab Supplies", "Miscellaneous"];
const COLORS = ["#0EA5E9", "#0369A1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#64748B"];

const empty: Omit<Expense, "id"> = { date: todayISO(), category: "Medicines", description: "", amount: 0, paidBy: "Admin", receiptNote: "" };

const Expenses = () => {
  const { expenses, addExpense, deleteExpense } = useHospital();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [month, setMonth] = useState(monthKey(todayISO()));

  const today = todayISO();
  const todays = expenses.filter((e) => e.date === today);
  const todayTotal = todays.reduce((s, e) => s + e.amount, 0);

  const monthly = expenses.filter((e) => monthKey(e.date) === month);
  const monthTotal = monthly.reduce((s, e) => s + e.amount, 0);

  const byCategory = useMemo(() => CATS.map((c, i) => ({
    name: c, value: monthly.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0), fill: COLORS[i],
  })).filter((x) => x.value > 0), [monthly]);

  const byDay = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const iso = `${month}-${d}`;
      return { day: i + 1, total: monthly.filter((e) => e.date === iso).reduce((s, e) => s + e.amount, 0) };
    });
  }, [monthly, month]);

  const exportCSV = () => {
    const rows = [
      ["Date", "Category", "Description", "Paid By", "Amount (INR)", "Receipt Note"],
      ...expenses.map((e) => [e.date, e.category, e.description, e.paidBy, e.amount, e.receiptNote || ""]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) { toast.error("Amount must be positive"); return; }
    addExpense(form);
    toast.success("Expense added");
    setOpen(false); setForm(empty);
  };

  return (
    <>
      <PageHeader title="Expenses" subtitle="Track daily and monthly hospital expenses."
        actions={
          <>
            <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Add Expense</Button>
          </>
        }
      />

      <Tabs defaultValue="daily">
        <TabsList><TabsTrigger value="daily">Daily View</TabsTrigger><TabsTrigger value="monthly">Monthly View</TabsTrigger></TabsList>

        <TabsContent value="daily" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Today's Total" value={inr(todayTotal)} icon={Wallet} tone="amber" hint={fmtDate(today)} />
            <StatCard label="Today's Entries" value={todays.length} icon={Wallet} tone="primary" />
            <StatCard label="Avg / entry" value={todays.length ? inr(Math.round(todayTotal / todays.length)) : inr(0)} icon={Wallet} tone="green" />
          </div>
          <div className="rounded-2xl bg-background border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60"><tr>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Description</th>
                <th className="text-left px-4 py-3 font-semibold">Paid By</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
                <th className="text-right px-4 py-3 font-semibold"></th>
              </tr></thead>
              <tbody>
                {todays.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No expenses today.</td></tr> :
                  todays.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="px-4 py-3"><span className="text-xs font-semibold px-2 py-1 rounded bg-primary-soft text-primary-deep">{e.category}</span></td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.paidBy}</td>
                      <td className="px-4 py-3 text-right font-semibold">{inr(e.amount)}</td>
                      <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost" onClick={() => setConfirm(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                    </tr>
                  ))}
              </tbody>
              {todays.length > 0 && <tfoot><tr className="border-t border-border bg-secondary/40"><td colSpan={3} className="px-4 py-3 font-semibold">Total</td><td className="px-4 py-3 text-right font-display font-bold text-primary-deep">{inr(todayTotal)}</td><td /></tr></tfoot>}
            </table>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-4 space-y-4">
          <div className="rounded-2xl bg-background border border-border p-4 shadow-card flex flex-wrap items-end gap-4">
            <div className="space-y-1"><Label>Month</Label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
            <div className="ml-auto"><StatCard label="Monthly Total" value={inr(monthTotal)} icon={Wallet} tone="amber" /></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl bg-background border border-border p-5 shadow-card">
              <h3 className="font-display font-bold text-primary-deep mb-2">Daily Spend</h3>
              <div className="h-72">
                <ResponsiveContainer><BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip /><Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart></ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl bg-background border border-border p-5 shadow-card">
              <h3 className="font-display font-bold text-primary-deep mb-2">By Category</h3>
              <div className="h-72">
                {byCategory.length === 0 ? <div className="grid place-items-center h-full text-muted-foreground text-sm">No data</div> :
                  <ResponsiveContainer><PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={85} paddingAngle={3}>
                      {byCategory.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie><Tooltip /><Legend />
                  </PieChart></ResponsiveContainer>}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-background border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60"><tr>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-right px-4 py-3 font-semibold">Total</th>
                <th className="text-right px-4 py-3 font-semibold">Entries</th>
              </tr></thead>
              <tbody>
                {CATS.map((c) => {
                  const items = monthly.filter((e) => e.category === c);
                  const tot = items.reduce((s, e) => s + e.amount, 0);
                  return <tr key={c} className="border-t border-border"><td className="px-4 py-3">{c}</td><td className="px-4 py-3 text-right font-semibold">{inr(tot)}</td><td className="px-4 py-3 text-right text-muted-foreground">{items.length}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v: ExpenseCategory) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: +e.target.value })} required /></div>
            <div className="space-y-2"><Label>Paid By</Label><Input value={form.paidBy} onChange={(e) => setForm({ ...form, paidBy: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Receipt Note</Label><Textarea rows={2} value={form.receiptNote} onChange={(e) => setForm({ ...form, receiptNote: e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Add</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete expense?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteExpense(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default Expenses;