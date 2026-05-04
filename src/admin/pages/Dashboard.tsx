import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, BedDouble, CalendarDays, Wallet, Receipt, UserCheck, Plus } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { useHospital } from "../context/HospitalContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { inr, fmtDate, todayISO, monthKey } from "../utils/formatters";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const { patients, appointments, beds, expenses, bills, staff } = useHospital();
  const today = todayISO();

  const todaysPatients = patients.filter((p) => p.admissionDate === today).length;
  const todaysAppts = appointments.filter((a) => a.date === today).length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const onDuty = staff.filter((s) => s.active).length;
  const pendingBills = bills.filter((b) => b.status !== "Paid").length;
  const monthRevenue = bills
    .filter((b) => monthKey(b.date) === monthKey(today) && b.status === "Paid")
    .reduce((s, b) => s + b.total, 0);

  const revVsExp = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      map[key] = { month: d.toLocaleString("en-IN", { month: "short" }), revenue: 0, expenses: 0 };
    }
    bills.forEach((b) => { const k = monthKey(b.date); if (map[k] && b.status === "Paid") map[k].revenue += b.total; });
    expenses.forEach((e) => { const k = monthKey(e.date); if (map[k]) map[k].expenses += e.amount; });
    return Object.values(map);
  }, [bills, expenses]);

  const deptData = [
    { name: "Gynecology", value: patients.filter((p) => p.department === "Gynecology").length, fill: "hsl(var(--gyn-strong))" },
    { name: "Pediatrics", value: patients.filter((p) => p.department === "Pediatrics").length, fill: "hsl(var(--peds-strong))" },
  ];

  const recent = [
    ...appointments.slice(0, 3).map((a) => ({ kind: "Appointment", text: `${a.patientName} • ${a.doctor}`, date: `${a.date} ${a.time}` })),
    ...patients.slice(0, 3).map((p) => ({ kind: p.type === "IPD" ? "Admission" : "OPD Visit", text: `${p.name} • ${p.department}`, date: p.admissionDate })),
  ].slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name ?? "User"}`}
        subtitle="Here's what's happening at Care Hospital today."
        actions={
          <>
            <Button asChild><Link to="/admin/patients"><Plus className="h-4 w-4 mr-1.5" />Add Patient</Link></Button>
            <Button asChild variant="outline"><Link to="/admin/appointments"><CalendarDays className="h-4 w-4 mr-1.5" />New Appointment</Link></Button>
            {user?.role === "admin" && <Button asChild variant="outline"><Link to="/admin/expenses"><Wallet className="h-4 w-4 mr-1.5" />Add Expense</Link></Button>}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Patients Today" value={todaysPatients} icon={Users} tone="primary" />
        <StatCard label="Available Beds" value={availableBeds} icon={BedDouble} tone="green" />
        <StatCard label="Appointments Today" value={todaysAppts} icon={CalendarDays} tone="gyn" />
        <StatCard label="Monthly Revenue" value={inr(monthRevenue)} icon={Receipt} tone="peds" />
        <StatCard label="Pending Bills" value={pendingBills} icon={Wallet} tone="amber" />
        <StatCard label="Staff On Duty" value={onDuty} icon={UserCheck} tone="rose" />
      </div>

      {user?.role === "admin" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-background border border-border p-5 shadow-card">
            <h3 className="font-display font-bold text-primary-deep">Revenue vs Expenses</h3>
            <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revVsExp}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Revenue" />
                  <Bar dataKey="expenses" fill="hsl(var(--gyn-strong))" radius={[6, 6, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-background border border-border p-5 shadow-card">
            <h3 className="font-display font-bold text-primary-deep">Patients by Department</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {deptData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-background border border-border p-5 shadow-card">
        <h3 className="font-display font-bold text-primary-deep mb-4">Recent Activity</h3>
        <ul className="divide-y divide-border">
          {recent.length === 0 && <li className="py-4 text-sm text-muted-foreground">No recent activity.</li>}
          {recent.map((r, i) => (
            <li key={i} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-deep bg-primary-soft px-2 py-1 rounded">{r.kind}</span>
                <span className="text-sm truncate">{r.text}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{fmtDate(r.date)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Dashboard;