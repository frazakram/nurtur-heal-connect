import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarHeart } from "lucide-react";

interface Props {
  trigger?: React.ReactNode;
  variant?: "default" | "hero" | "outline" | "secondary";
  size?: "default" | "lg" | "sm";
  className?: string;
  label?: string;
}

export const AppointmentModal = ({ trigger, variant = "default", size = "default", className, label = "Book Appointment" }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", department: "", date: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.department || !form.date) {
      toast.error("Please fill out all fields");
      return;
    }
    toast.success("Appointment requested! We'll call you shortly.");
    setOpen(false);
    setForm({ name: "", phone: "", department: "", date: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={variant as any} size={size} className={className}>
            <CalendarHeart className="mr-2 h-4 w-4" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Book an Appointment</DialogTitle>
          <DialogDescription>We'll get back to you within a few hours.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ap-name">Full Name</Label>
            <Input id="ap-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-phone">Phone</Label>
            <Input id="ap-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Gynecology">Gynecology</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ap-date">Preferred Date</Label>
            <Input id="ap-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" size="lg">Request Appointment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};