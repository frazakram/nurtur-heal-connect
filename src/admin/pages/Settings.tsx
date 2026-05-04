import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHospital } from "../context/HospitalContext";
import { toast } from "sonner";

const STAFF_ACCOUNTS = [
  { label: "Admin", email: "admin@carehospital.in" },
  { label: "Receptionist", email: "reception@carehospital.in" },
  { label: "Medical Assistant", email: "assistant@carehospital.in" },
];

const Settings = () => {
  const { info, modules, updateInfo, toggleModule, resetData } = useHospital();
  const [form, setForm] = useState(info);
  const [pw, setPw] = useState<Record<string, string>>({});

  return (
    <>
      <PageHeader title="Settings" subtitle="Configure hospital information and modules." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
          <h3 className="font-display font-bold text-primary-deep mb-4">Hospital Info</h3>
          <form onSubmit={(e) => { e.preventDefault(); updateInfo(form); toast.success("Saved"); }} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </div>

        <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
          <h3 className="font-display font-bold text-primary-deep mb-4">Manage Staff Credentials</h3>
          <div className="space-y-3">
            {STAFF_ACCOUNTS.map((s) => (
              <div key={s.email} className="flex items-end gap-2">
                <div className="flex-1 space-y-1"><Label className="text-xs">{s.label} • {s.email}</Label>
                  <Input type="password" placeholder="New password" value={pw[s.email] || ""} onChange={(e) => setPw({ ...pw, [s.email]: e.target.value })} />
                </div>
                <Button variant="outline" onClick={() => { toast.success(`Password updated for ${s.label} (demo)`); setPw({ ...pw, [s.email]: "" }); }}>Update</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-background border border-border p-6 shadow-card lg:col-span-2">
          <h3 className="font-display font-bold text-primary-deep mb-4">Modules</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(modules).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <span className="text-sm font-medium capitalize">{k}</span>
                <Switch checked={v} onCheckedChange={() => toggleModule(k)} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-background border border-border p-6 shadow-card lg:col-span-2">
          <h3 className="font-display font-bold text-primary-deep mb-2">Data</h3>
          <p className="text-sm text-muted-foreground mb-4">All HMS data is stored locally in your browser.</p>
          <Button variant="destructive" onClick={() => { if (confirm("Reset all HMS data to seed?")) { resetData(); toast.success("Data reset"); } }}>Reset Demo Data</Button>
        </div>
      </div>
    </>
  );
};

export default Settings;