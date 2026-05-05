import { useMemo } from "react";
import { Printer, Users, BedDouble, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { useHospital } from "../context/HospitalContext";
import { inr, monthKey, todayISO } from "../utils/formatters";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const printReport = () => {
  const prev = document.title;
  document.title = `Care-Hospital-Report-${new Date().toISOString().slice(0, 10)}`;
  window.print();
  document.title = prev;
};

const Reports = () => {
  const { patients, beds, bills, expenses } = useHospital();
  const month = monthKey(todayISO());

  const opd = patients.filter((p) => p.type === "OPD").length;
  const ipd = patients.filter((p) => p.type === "IPD" && p.status !== "Discharged").length;
  const discharged = patients.filter((p) => p.status === "Discharged").length;
  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const bedRate = beds.length ? Math.round((occupiedBeds / beds.length) * 100) : 0;

  const monthRevenue = bills.filter((b) => monthKey(b.date) === month && b.status === "Paid").reduce((s, b) => s + b.total, 0);
  const monthExpenses = expenses.filter((e) => monthKey(e.date) === month).reduce((s, e) => s + e.amount, 0);

  const chart6 = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map[monthKey(d)] = { month: d.toLocaleString("en-IN", { month: "short" }), revenue: 0, expenses: 0 };
    }
    bills.forEach((b) => { const k = monthKey(b.date); if (map[k] && b.status === "Paid") map[k].revenue += b.total; });
    expenses.forEach((e) => { const k = monthKey(e.date); if (map[k]) map[k].expenses += e.amount; });
    return Object.values(map);
  }, [bills, expenses]);

  const deptData = [
    { name: "Gynecology", value: patients.filter((p) => p.department === "Gynecology").length, fill: "hsl(var(--gyn-strong))" },
    { name: "Pediatrics", value: patients.filter((p) => p.department === "Pediatrics").length, fill: "hsl(var(--peds-strong))" },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle="Hospital performance summary."
        actions={<Button onClick={printReport}><Printer className="h-4 w-4 mr-1.5" />Print / Save PDF</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="OPD Patients" value={opd} icon={Users} tone="primary" />
        <StatCard label="IPD Patients" value={ipd} icon={Users} tone="amber" />
        <StatCard label="Discharged" value={discharged} icon={Users} tone="green" />
        <StatCard label="Bed Occupancy" value={`${bedRate}%`} icon={BedDouble} tone="rose" hint={`${occupiedBeds}/${beds.length} beds`} />
        <StatCard label="Monthly Revenue" value={inr(monthRevenue)} icon={Receipt} tone="green" />
        <StatCard label="Monthly Expenses" value={inr(monthExpenses)} icon={Wallet} tone="amber" />
        <StatCard label="Net" value={inr(monthRevenue - monthExpenses)} icon={Receipt} tone="primary" />
        <StatCard label="Total Patients" value={patients.length} icon={Users} tone="gyn" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-background border border-border p-5 shadow-card">
          <h3 className="font-display font-bold text-primary-deep mb-4">Revenue vs Expenses (6 months)</h3>
          <div className="h-72"><ResponsiveContainer><BarChart data={chart6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip /><Legend />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--gyn-strong))" radius={[6, 6, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl bg-background border border-border p-5 shadow-card">
          <h3 className="font-display font-bold text-primary-deep mb-4">By Department</h3>
          <div className="h-72"><ResponsiveContainer><PieChart>
            <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
              {deptData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie><Tooltip /><Legend />
          </PieChart></ResponsiveContainer></div>
        </div>
      </div>
    </>
  );
};

export default Reports;