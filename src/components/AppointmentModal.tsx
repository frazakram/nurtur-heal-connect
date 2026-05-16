import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarHeart, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHospital, type Department } from "../admin/context/HospitalContext";
import { fmtDate } from "../admin/utils/formatters";
import { getAvailableSlots, label12 } from "@/lib/slots";

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
  const { addAppointment, doctors } = useHospital();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", department: defaultDepartment || "", date: "", time: "" });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ id: string; date: string; time: string; doctor: string } | null>(null);

  // Resolve the actual doctor: explicit prop wins, else first doctor of the
  // chosen department. We need a concrete doctor to show real availability.
  const doctor = useMemo(() => {
    if (defaultDoctor) return doctors.find((d) => d.name === defaultDoctor);
    if (form.department) {
      const accent = form.department === "Gynecology" ? "gyn" : "peds";
      return doctors.find((d) => d.accent === accent);
    }
    return undefined;
  }, [doctors, defaultDoctor, form.department]);

  const loadSlots = useCallback(async () => {
    if (!doctor || !form.date) { setSlots([]); return; }
    setLoadingSlots(true);
    const available = await getAvailableSlots(doctor.id, form.date, doctor.schedule);
    setSlots(available);
    setLoadingSlots(false);
  }, [doctor, form.date]);

  useEffect(() => {
    if (!open) return;
    setForm((f) => ({ ...f, time: "" }));
    loadSlots();
  }, [open, doctor, form.date, loadSlots]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.department || !form.date || !form.time) {
      toast.error("Please fill out all fields");
      return;
    }
    if (!doctor) {
      toast.error("No doctor is available for this department yet. Please call us to book.");
      return;
    }

    setSubmitting(true);
    const id = await addAppointment({
      patientName: form.name,
      phone: form.phone,
      department: form.department as Department,
      doctor: doctor.name,
      date: form.date,
      time: form.time,
    });
    setSubmitting(false);

    if (!id) {
      // Most likely the slot was taken between viewing and submitting
      // (DB unique index rejected it). Refresh and let them re-pick.
      toast.error("That slot was just taken. Please choose another time.");
      setForm((f) => ({ ...f, time: "" }));
      loadSlots();
      return;
    }

    toast.success("Appointment booked successfully!");
    setConfirmation({ id, date: form.date, time: form.time, doctor: doctor.name });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setTimeout(() => {
        setForm({ name: "", phone: "", department: defaultDepartment || "", date: "", time: "" });
        setSlots([]);
        setConfirmation(null);
      }, 300);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

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
                <span className="font-medium">{label12(confirmation.time)}</span>
              </div>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Book an Appointment</DialogTitle>
              <DialogDescription>Pick a date to see live availability — only free slots are shown.</DialogDescription>
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
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v, time: "" })} disabled={!!defaultDoctor}>
                    <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gynecology">Gynecology</SelectItem>
                      <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ap-date">Date</Label>
                  <Input id="ap-date" type="date" value={form.date} min={today} onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })} />
                </div>
              </div>

              {doctor && (
                <p className="text-xs text-muted-foreground">
                  You'll be booked with <span className="font-semibold text-primary-deep">{doctor.name}</span>
                  {doctor.role ? ` · ${doctor.role}` : ""}
                </p>
              )}

              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                <div className="rounded-xl border border-border p-3 min-h-[84px]">
                  {!doctor ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Select a department to see availability.</p>
                  ) : !form.date ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Pick a date to see available times.</p>
                  ) : loadingSlots ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No free slots for {doctor.name} on this date. Please try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm({ ...form, time: s })}
                          className={cn(
                            "rounded-lg border text-xs font-semibold py-2 transition-colors",
                            form.time === s
                              ? "bg-primary text-white border-primary"
                              : "border-border hover:border-primary hover:bg-primary-soft/40",
                          )}
                        >
                          {label12(s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting || !form.time}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</> : "Confirm Appointment"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
