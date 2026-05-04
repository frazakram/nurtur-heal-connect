import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHospital } from "../context/HospitalContext";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const STAFF_ACCOUNTS = [
  { label: "Admin", email: "admin@carehospital.in" },
  { label: "Receptionist", email: "reception@carehospital.in" },
  { label: "Medical Assistant", email: "assistant@carehospital.in" },
];

const Settings = () => {
  const { info, modules, updateInfo, toggleModule, resetData, doctors, addDoctor, updateDoctor, deleteDoctor } = useHospital();
  const [form, setForm] = useState(info);
  const [pw, setPw] = useState<Record<string, string>>({});
  
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [docForm, setDocForm] = useState<any>({ name: "", role: "", qualification: "", experience: "", bio: "", languages: "", img: "", accent: "gyn" });

  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...docForm, languages: Array.isArray(docForm.languages) ? docForm.languages : docForm.languages.split(",").map((l: string) => l.trim()) };
    if (editingDoc) updateDoctor(editingDoc.id, d);
    else addDoctor(d);
    setDocModalOpen(false);
    toast.success("Doctor saved");
  };

  const openEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setDocForm({ ...doc, languages: doc.languages?.join(", ") || "" });
    setDocModalOpen(true);
  };

  const openAddDoc = () => {
    setEditingDoc(null);
    setDocForm({ name: "", role: "", qualification: "", experience: "", bio: "", languages: "", img: "", accent: "gyn" });
    setDocModalOpen(true);
  };

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-primary-deep">Manage Doctors</h3>
            <Button size="sm" onClick={openAddDoc}><Plus className="h-4 w-4 mr-2" /> Add Doctor</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map(d => (
              <div key={d.id} className="border border-border rounded-xl p-4 flex gap-4 bg-secondary/20">
                <img src={d.img} alt={d.name} className="h-16 w-16 rounded-full object-cover shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-primary-deep truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{d.role}</div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEditDoc(d)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700" onClick={() => { if(confirm("Delete doctor?")) deleteDoctor(d.id); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
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

        <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingDoc ? "Edit Doctor" : "Add Doctor"}</DialogTitle></DialogHeader>
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input required value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Role / Department</Label><Input required value={docForm.role} onChange={e => setDocForm({...docForm, role: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Accent (Color)</Label>
                  <select className="w-full h-10 px-3 py-2 border rounded-md" value={docForm.accent} onChange={e => setDocForm({...docForm, accent: e.target.value})}>
                    <option value="gyn">Gynecology (Pink)</option>
                    <option value="peds">Pediatrics (Blue)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2"><Label>Qualifications</Label><Input value={docForm.qualification} onChange={e => setDocForm({...docForm, qualification: e.target.value})} /></div>
              <div className="space-y-2"><Label>Experience</Label><Input value={docForm.experience} onChange={e => setDocForm({...docForm, experience: e.target.value})} /></div>
              <div className="space-y-2"><Label>Languages (comma separated)</Label><Input value={docForm.languages} onChange={e => setDocForm({...docForm, languages: e.target.value})} /></div>
              <div className="space-y-2"><Label>Image URL (Unsplash)</Label><Input type="url" value={docForm.img} onChange={e => setDocForm({...docForm, img: e.target.value})} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea rows={3} value={docForm.bio} onChange={e => setDocForm({...docForm, bio: e.target.value})} /></div>
              <Button type="submit" className="w-full">Save Doctor</Button>
            </form>
          </DialogContent>
        </Dialog>

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