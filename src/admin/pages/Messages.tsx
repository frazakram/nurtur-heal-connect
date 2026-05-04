import { useState, useEffect } from "react";
import { Check, Trash2, MailOpen, Mail } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fmtDate } from "../utils/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Message {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  date: string;
  read?: boolean;
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewMsg, setViewMsg] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const data = JSON.parse(localStorage.getItem('messages') || '[]');
    // Make sure all have an ID
    const migrated = data.map((m: any, i: number) => ({ ...m, id: m.id || `msg-${i}-${Date.now()}` }));
    // Sort by date desc
    migrated.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setMessages(migrated);
    localStorage.setItem('messages', JSON.stringify(migrated));
  };

  const toggleRead = (id: string, currentReadStatus: boolean) => {
    const updated = messages.map(m => m.id === id ? { ...m, read: !currentReadStatus } : m);
    setMessages(updated);
    localStorage.setItem('messages', JSON.stringify(updated));
    toast.success(currentReadStatus ? "Marked as unread" : "Marked as read");
  };

  const deleteMessage = (id: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      localStorage.setItem('messages', JSON.stringify(updated));
      toast.success("Message deleted");
    }
  };

  const cols: Column<Message>[] = [
    { key: "name", header: "Sender", render: (r) => (
      <div className="flex items-center gap-3">
        <div className="grid place-items-center h-8 w-8 rounded-full bg-secondary text-primary-deep font-bold text-xs">
          {r.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className={`font-medium ${r.read ? 'text-foreground/70' : 'text-primary-deep font-bold'}`}>{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.email || r.phone}</div>
        </div>
      </div>
    ) },
    { key: "message", header: "Message", render: (r) => (
      <div className={`max-w-[300px] truncate text-sm ${r.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
        {r.message}
      </div>
    ) },
    { key: "date", header: "Received On", render: (r) => (
      <div className="text-sm text-muted-foreground">{fmtDate(r.date)}</div>
    ) },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="outline" onClick={() => { setViewMsg(r); if (!r.read) toggleRead(r.id, false); }}>Read</Button>
        <Button size="icon" variant="ghost" onClick={() => toggleRead(r.id, !!r.read)} title={r.read ? "Mark as unread" : "Mark as read"}>
          {r.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={() => deleteMessage(r.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Messages" subtitle="Manage inquiries and contact form submissions." />
      <div className="rounded-xl bg-background border border-border shadow-sm overflow-hidden">
        <DataTable columns={cols} data={messages} />
      </div>

      <Dialog open={!!viewMsg} onOpenChange={(v) => !v && setViewMsg(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message from {viewMsg?.name}</DialogTitle>
            <DialogDescription>Received on {viewMsg?.date && fmtDate(viewMsg.date)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <span className="text-sm text-muted-foreground">Contact Info:</span>
              <span className="font-medium">{viewMsg?.phone}</span>
              <span className="font-medium text-primary">{viewMsg?.email}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Message:</span>
              <div className="p-4 bg-secondary/50 rounded-xl whitespace-pre-wrap text-sm leading-relaxed">
                {viewMsg?.message}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Messages;
