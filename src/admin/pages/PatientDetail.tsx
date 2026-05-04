import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BedDouble, Phone, MapPin, Stethoscope, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHospital } from "../context/HospitalContext";
import { fmtDate } from "../utils/formatters";

const PatientDetail = () => {
  const { id = "" } = useParams();
  const { patients, beds, appointments, bills } = useHospital();
  const p = patients.find((x) => x.id === id);

  if (!p) return (
    <div className="rounded-2xl bg-background border border-border p-10 text-center">
      <p className="text-muted-foreground">Patient not found.</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/admin/patients">Back to patients</Link></Button>
    </div>
  );

  const bed = beds.find((b) => b.patientId === p.id);
  const visits = appointments.filter((a) => a.patientName.toLowerCase() === p.name.toLowerCase());
  const patientBills = bills.filter((b) => b.patientId === p.id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/admin/patients"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl bg-background border border-border p-6 shadow-card">
          <div className="grid h-20 w-20 place-items-center rounded-2xl gradient-primary text-primary-foreground font-display text-2xl font-bold mb-4">
            {p.name[0]}
          </div>
          <h2 className="font-display text-xl font-bold text-primary-deep">{p.name}</h2>
          <p className="text-sm text-muted-foreground">{p.age} yrs • {p.gender}</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex gap-2"><Phone className="h-4 w-4 text-primary mt-0.5" /> {p.phone}</div>
            {p.address && <div className="flex gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" /> {p.address}</div>}
            <div className="flex gap-2"><Stethoscope className="h-4 w-4 text-primary mt-0.5" /> {p.doctor} • {p.department}</div>
            <div className="flex gap-2"><BedDouble className="h-4 w-4 text-primary mt-0.5" /> {bed ? `${bed.number} (${bed.ward})` : "Not assigned"}</div>
          </div>
          <div className="mt-6 flex gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primary-soft text-primary-deep">{p.type}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-secondary text-foreground/70">{p.status}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-secondary text-foreground/70">Admitted {fmtDate(p.admissionDate)}</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <h3 className="font-display font-bold text-primary-deep flex items-center gap-2"><FileText className="h-4 w-4" /> Notes</h3>
            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{p.notes || "No notes recorded."}</p>
          </div>

          <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <h3 className="font-display font-bold text-primary-deep">Visit History</h3>
            <ul className="mt-3 divide-y divide-border">
              {visits.length === 0 && <li className="py-3 text-sm text-muted-foreground">No appointments yet.</li>}
              {visits.map((v) => (
                <li key={v.id} className="py-3 flex items-center justify-between text-sm">
                  <div><div className="font-medium">{v.doctor}</div><div className="text-xs text-muted-foreground">{v.department}</div></div>
                  <div className="text-right"><div>{fmtDate(v.date)}</div><div className="text-xs text-muted-foreground">{v.time} • {v.status}</div></div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <h3 className="font-display font-bold text-primary-deep">Bills</h3>
            <ul className="mt-3 divide-y divide-border">
              {patientBills.length === 0 && <li className="py-3 text-sm text-muted-foreground">No bills generated.</li>}
              {patientBills.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="font-medium">₹ {b.total.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(b.date)} • {b.status}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDetail;