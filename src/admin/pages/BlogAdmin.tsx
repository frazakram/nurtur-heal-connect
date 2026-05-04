import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHospital, BlogPost } from "../context/HospitalContext";
import { todayISO, fmtDate } from "../utils/formatters";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

const empty: Omit<BlogPost, "id"> = {
  title: "",
  date: todayISO(),
  excerpt: "",
  content: "",
  img: "https://images.unsplash.com/photo-1555252113-f9f30b91e921?w=600&q=80",
  accent: "gyn",
  author: "",
  published: true,
};

const BlogAdmin = () => {
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useHospital();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState<string | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (b: BlogPost) => { setEditing(b); setForm(b); setOpen(true); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.excerpt || !form.content) { toast.error("Please fill all required fields"); return; }
    if (editing) { updateBlogPost(editing.id, form); toast.success("Blog post updated"); }
    else { addBlogPost(form); toast.success("Blog post created"); }
    setOpen(false);
  };

  const cols: Column<BlogPost>[] = [
    { key: "title", header: "Post", render: (r) => (
      <div className="flex items-center gap-3">
        <img src={r.img} alt={r.title} className="w-12 h-12 rounded object-cover" />
        <div>
          <div className="font-medium text-primary-deep">{r.title}</div>
          <div className="text-xs text-muted-foreground truncate max-w-sm">{r.excerpt}</div>
        </div>
      </div>
    ) },
    { key: "date", header: "Date", render: (r) => fmtDate(r.date) },
    { key: "accent", header: "Category", render: (r) => (
      <span className="text-xs uppercase px-2 py-1 bg-secondary rounded text-primary-deep">{r.accent}</span>
    ) },
    { key: "status", header: "Status", render: (r) => (
      <span className={`text-xs px-2 py-1 rounded font-medium ${r.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
        {r.published ? 'Published' : 'Draft'}
      </span>
    ) },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => setConfirm(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Blog Posts" subtitle="Manage content for the patient-facing health blog."
        actions={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />New Post</Button>} />

      <DataTable columns={cols} data={blogPosts} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Blog Post" : "New Blog Post"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div className="space-y-2">
              <Label>Category (Accent)</Label>
              <Select value={form.accent} onValueChange={(v: any) => setForm({ ...form, accent: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="gyn">Gynecology</SelectItem><SelectItem value="peds">Pediatrics</SelectItem><SelectItem value="primary">General</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Author</Label><Input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Image URL (Unsplash)</Label><Input value={form.img} onChange={(e) => setForm({ ...form, img: e.target.value })} required /></div>
            <div className="space-y-2 sm:col-span-2 flex items-center justify-between border rounded-xl p-4">
              <div>
                <Label className="text-base">Publish Status</Label>
                <div className="text-sm text-muted-foreground">Drafts won't be shown on the public site.</div>
              </div>
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
            </div>
            <div className="space-y-2 sm:col-span-2"><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Content</Label><Textarea className="min-h-[150px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? "Save changes" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!confirm} title="Delete post?" onClose={() => setConfirm(null)}
        onConfirm={() => { if (confirm) { deleteBlogPost(confirm); toast.success("Deleted"); } }} />
    </>
  );
};

export default BlogAdmin;
