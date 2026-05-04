import { useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, InventoryItem } from "../context/HospitalContext";
import { fmtDate } from "../utils/formatters";
import { toast } from "sonner";

const empty: Omit<InventoryItem, "id" | "updatedAt"> = { name: "", category: "Medicine", quantity: 0, unit: "pcs", reorderLevel: 10 };

const Inventory = () => {
  const { inventory, addInventory, updateInventory, deleteInventory } = useHospital();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (i: InventoryItem) => { setEditing(i); setForm(i); setOpen(true); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    if (editing) { updateInventory(editing.id, form); toast.success("Updated"); }
    else { addInventory(form); toast.success("Added"); }
    setOpen(false);
  };

  const adjust = (i: InventoryItem, delta: number) => {
    const q = Math.max(0, i.quantity + delta);
    updateInventory(i.id, { quantity: q });
  };

  const lowCount = inventory.filter((i) => i.quantity <= i.reorderLevel).length;

  const cols: Column<InventoryItem>[] = [
    { key: "name", header: "Item", render: (r) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-primary-deep">{r.name}</span>
        {r.quantity <= r.reorderLevel && <AlertTriangle className="h-4 w-4 text-destructive" />}
      </div>
    ) },
    { key: "category", header: "Category" },
    { key: "quantity", header: "Quantity", render: (r) => (
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${r.quantity <= r.reorderLevel ? "text-destructive" : ""}`}>{r.quantity} {r.unit}</span>
        <Button size="icon" variant="ghost" onClick={() => adjust(r, +1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" onClick={() => adjust(r, -1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
      </div>
    ) },
    { key: "reorderLevel", header: "Reorder ≤" },
    { key: "updatedAt", header: "Updated", render: (r) => fmtDate(r.updatedAt) },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Inventory" subtitle={`Manage medicine and equipment stock${lowCount ? ` — ${lowCount} item(s) low on stock` : ""}.`}
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Add Item</Button>} />

      <DataTable columns={cols} data={inventory} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Medicine">Medicine</SelectItem><SelectItem value="Equipment">Equipment</SelectItem><SelectItem value="Consumable">Consumable</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" min={0} value={form.quantity || ""} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} /></div>
            <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" min={0} value={form.reorderLevel || ""} onChange={(e) => setForm({ ...form, reorderLevel: +e.target.value })} /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete item?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteInventory(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default Inventory;