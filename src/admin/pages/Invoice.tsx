import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHospital } from "../context/HospitalContext";
import { fmtDate, inr } from "../utils/formatters";

const Invoice = () => {
  const { id = "" } = useParams();
  const { bills, info } = useHospital();
  const bill = bills.find((b) => b.id === id);

  if (!bill) return (
    <div className="rounded-2xl bg-background border border-border p-10 text-center">
      <p className="text-muted-foreground">Invoice not found.</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/admin/billing">Back</Link></Button>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/billing"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl bg-background border border-border p-8 shadow-card print:shadow-none print:border-0">
        <div className="flex justify-between items-start border-b border-border pb-6">
          <div>
            <div className="font-display text-2xl font-bold text-primary-deep">{info.name}</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{info.address}</p>
            <p className="text-sm text-muted-foreground mt-1">{info.phone} • {info.email}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-xl font-bold text-primary-deep">INVOICE</div>
            <div className="text-xs text-muted-foreground mt-1">#{bill.id.slice(0, 8).toUpperCase()}</div>
            <div className="text-xs text-muted-foreground">{fmtDate(bill.date)}</div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-6 text-sm">
          <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Patient</div><div className="font-semibold mt-1">{bill.patientName}</div><div className="text-muted-foreground">{bill.department}</div></div>
          <div className="sm:text-right"><div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div><div className="font-semibold mt-1">{bill.status} • {bill.payMode}</div></div>
        </div>

        <table className="w-full mt-8 text-sm">
          <thead className="border-b border-border"><tr><th className="text-left py-2 font-semibold">Description</th><th className="text-right py-2 font-semibold">Amount</th></tr></thead>
          <tbody>{bill.items.map((it, i) => (
            <tr key={i} className="border-b border-border/60"><td className="py-2.5">{it.name}</td><td className="py-2.5 text-right">{inr(it.amount)}</td></tr>
          ))}</tbody>
          <tfoot><tr><td className="py-3 font-display font-bold text-primary-deep">Total</td><td className="py-3 text-right font-display text-xl font-bold text-primary-deep">{inr(bill.total)}</td></tr></tfoot>
        </table>

        <p className="mt-10 text-xs text-muted-foreground text-center">Thank you for choosing {info.name}. Get well soon!</p>
      </div>
    </>
  );
};

export default Invoice;