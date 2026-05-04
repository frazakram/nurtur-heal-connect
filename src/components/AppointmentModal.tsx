import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarHeart, CheckCircle2 } from "lucide-react";
import { useHospital } from "../admin/context/HospitalContext";
import { fmtDate } from "../admin/utils/formatters";

interface Props {
  trigger?: React.ReactNode;
  variant?: "default" | "hero" | "outline" | "secondary";
  size?: "default" | "lg" | "sm";
  className?: string;
  label?: string;
  defaultDoctor?: string;
  defaultDepartment?: string;
}

export const AppointmentModal = ({ trigger, variant = "default", size = "default", className, label = "Book Appointment", defaultDoctor, defaultDepartment }: Props) => {
  const { addAppointment } = useHospital();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", department: defaultDepartment || "", date: "", time: "" });
  const [confirmation, setConfirmation] = useState<{ id: string; date: string; time: string; doctor: string } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.department || !form.date || !form.time) {
      toast.error("Please fill out all fields");
      return;
    }
    
    const assignedDoctor = defaultDoctor || (form.department === "Gynecology" ? "Dr. Anjali Verma" : "Dr. Rajeev Kumar");
    
    const id = addAppointment({
      patientName: form.name,
      phone: form.phone,
      department: form.department as any,
      doctor: assignedDoctor,
      date: form.date,
      time: form.time
    });

    toast.success("Appointment booked successfully!");
    setConfirmation({ id, date: form.date, time: form.time, doctor: assignedDoctor });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      // Reset after closing
      setTimeout(() => {
        setForm({ name: "", phone: "", department: defaultDepartment || "", date: "", time: "" });
        setConfirmation(null);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={variant as any} size={size} className={className}>
            <CalendarHeart className="mr-2 h-4 w-4" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {confirmation ? (
          <div className="py-6 text-center space-y-6">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-primary-deep">Booking Confirmed</h2>
              <p className="text-muted-foreground mt-2">Your appointment has been successfully scheduled.</p>
            </div>
            <div className="bg-secondary p-4 rounded-xl text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appointment ID:</span>
                <span className="font-mono font-medium">{confirmation.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-medium">{confirmation.doctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{fmtDate(confirmation.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{confirmation.time}</span>
              </div>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-full">Done</Button>
          </div>
        ) : (
          <>
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="ap-date">Date</Label>
                  <Input id="ap-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select value={form.time} onValueChange={(v) => setForm({ ...form, time: v })}>
                  <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Morning</SelectLabel>
                      <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                      <SelectItem value="09:30 AM">09:30 AM</SelectItem>
                      <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                      <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                      <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                      <SelectItem value="11:30 AM">11:30 AM</SelectItem>
                      <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                      <SelectItem value="12:30 PM">12:30 PM</SelectItem>
                      <SelectItem value="01:00 PM">01:00 PM</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Evening</SelectLabel>
                      <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                      <SelectItem value="04:30 PM">04:30 PM</SelectItem>
                      <SelectItem value="05:00 PM">05:00 PM</SelectItem>
                      <SelectItem value="05:30 PM">05:30 PM</SelectItem>
                      <SelectItem value="06:00 PM">06:00 PM</SelectItem>
                      <SelectItem value="06:30 PM">06:30 PM</SelectItem>
                      <SelectItem value="07:00 PM">07:00 PM</SelectItem>
                      <SelectItem value="07:30 PM">07:30 PM</SelectItem>
                      <SelectItem value="08:00 PM">08:00 PM</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" size="lg">Request Appointment</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};