import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, FileText, History, Pill, LogOut, Loader2, CalendarClock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "../admin/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useHospital, type Appointment, type Department, type AppointmentStatus } from "../admin/context/HospitalContext";
import { fmtDate } from "../admin/utils/formatters";
import { getAvailableSlots, label12 } from "../lib/slots";
import { supabase } from "../lib/supabase";

const features = [
  { icon: CalendarCheck, title: "View Appointments", text: "See upcoming and past appointments at a glance." },
  { icon: FileText, title: "Download Reports", text: "Access your lab reports and discharge summaries." },
  { icon: History, title: "Medical History", text: "A consolidated view of your visits and diagnoses." },
  { icon: Pill, title: "Prescription Records", text: "Refer to active and past prescriptions anytime." },
];

const Portal = () => {
  const { doctors, info } = useHospital();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<{ name: string; phone: string; email?: string; registeredDate: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);

  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [resch, setResch] = useState<Appointment | null>(null);
  const [rDate, setRDate] = useState("");
  const [rTime, setRTime] = useState("");
  const [rSlots, setRSlots] = useState<string[]>([]);
  const [rLoading, setRLoading] = useState(false);
  const [rSaving, setRSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user.user_metadata?.role === 'patient') {
        setUser({
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || '',
          email: session.user.email,
          registeredDate: session.user.created_at
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user.user_metadata?.role === 'patient') {
        setUser({
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || '',
          email: session.user.email,
          registeredDate: session.user.created_at
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            phone: form.phone,
            role: 'patient'
          }
        }
      });
      if (error) {
        toast.error(error.message);
      } else if (!data.session) {
        // Email confirmation is enabled on the project: no session yet.
        toast.success("Account created — check your email to confirm, then log in.");
        setMode("login");
      } else {
        toast.success("Account created successfully!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logged out");
  };

  // The patient's own appointments come from a SECURITY DEFINER RPC that
  // derives identity from the auth JWT (RLS blocks any direct read), so the
  // browser can never see other patients' records.
  const loadMyAppts = useCallback(async () => {
    if (!user) { setMyAppts([]); return; }
    const { data } = await supabase.rpc("patient_appointments");
    const rows = (data || []) as Array<{
      id: string; patient_name: string | null; phone: string | null;
      doctor_id: string | null; department: string | null;
      date: string | null; time: string | null; status: string | null;
      booking_ref: string | null;
    }>;
    setMyAppts(rows.map(r => ({
      id: r.id,
      patientName: r.patient_name || "",
      phone: r.phone || "",
      doctor: doctors.find(d => d.id === r.doctor_id)?.name || "",
      department: (r.department as Department) || "Gynecology",
      date: r.date || "",
      time: (r.time || "").slice(0, 5),
      status: (r.status as AppointmentStatus) || "Scheduled",
      bookingRef: r.booking_ref || "",
    })));
  }, [user, doctors]);

  useEffect(() => { loadMyAppts(); }, [loadMyAppts]);

  const myAppointments = myAppts;

  const reschDoctor = resch ? doctors.find(d => d.name === resch.doctor) : undefined;

  const loadRSlots = useCallback(async () => {
    if (!resch || !rDate || !reschDoctor) { setRSlots([]); return; }
    setRLoading(true);
    const available = await getAvailableSlots(reschDoctor.id, rDate, reschDoctor.schedule);
    setRSlots(available);
    setRLoading(false);
  }, [resch, rDate, reschDoctor]);

  useEffect(() => { setRTime(""); loadRSlots(); }, [rDate, loadRSlots]);

  const openReschedule = (a: Appointment) => {
    setResch(a);
    setRDate("");
    setRTime("");
    setRSlots([]);
  };

  // Best-effort notification — the DB action already succeeded, so a mail
  // failure must not surface as an error to the patient.
  const sendApptEmail = async (
    type: "cancellation" | "reschedule",
    a: Appointment,
    extra?: { oldDate?: string; oldTime?: string; precautions?: string },
  ) => {
    const to = user?.email;
    if (!to) return;
    try {
      await supabase.functions.invoke("send-appointment-email", {
        body: {
          type,
          to,
          patientName: user?.name || a.patientName,
          doctorName: a.doctor,
          department: a.department,
          date: a.date,
          time: a.time,
          phone: a.phone,
          hospitalName: info.name,
          hospitalPhone: info.phone,
          hospitalEmail: info.email,
          precautions: extra?.precautions,
          oldDate: extra?.oldDate,
          oldTime: extra?.oldTime,
        },
      });
    } catch (e) {
      console.error("Notification email failed:", e);
    }
  };

  const doCancel = async () => {
    if (!cancelAppt) return;
    const a = cancelAppt;
    const { data, error } = await supabase.rpc("patient_set_appointment", {
      p_id: a.id, p_status: "Cancelled",
    });
    if (error || data === false) {
      toast.error("Couldn't cancel. Please call us.");
      setCancelAppt(null);
      return;
    }
    sendApptEmail("cancellation", a);
    toast.success("Appointment cancelled");
    setCancelAppt(null);
    loadMyAppts();
  };

  const doReschedule = async () => {
    if (!resch || !rDate || !rTime) return;
    const a = resch;
    const precautions = reschDoctor?.precautions;
    setRSaving(true);
    const { data, error } = await supabase.rpc("patient_set_appointment", {
      p_id: a.id, p_date: rDate, p_time: rTime,
    });
    setRSaving(false);
    if (error) {
      // The partial unique index rejected it — the slot was just taken.
      toast.error("That slot was just taken. Please pick another.");
      loadRSlots();
      return;
    }
    if (data === false) {
      toast.error("Couldn't reschedule. Please call us.");
      return;
    }
    sendApptEmail("reschedule", { ...a, date: rDate, time: rTime }, { oldDate: a.date, oldTime: a.time, precautions });
    toast.success("Appointment rescheduled");
    setResch(null);
    loadMyAppts();
  };

  return (
    <>
      <SEO title="Patient Portal | Care Hospital" description="Sign in to your Care Hospital patient portal to view appointments, reports and prescriptions." />

      <section className="gradient-hero">
        <div className="container py-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Patient Portal</h1>
          <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Your health records, appointments, and prescriptions — all in one place.</p>
        </div>
      </section>

      <section className="container py-16 grid gap-10 lg:grid-cols-2 items-start">
        {!user ? (
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-background border border-border p-8 shadow-card">
            <div className="flex gap-2 p-1 rounded-xl bg-secondary mb-6">
              <button onClick={() => setMode("login")} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "login" ? "bg-background text-primary-deep shadow-soft" : "text-muted-foreground"}`}>Login</button>
              <button onClick={() => setMode("register")} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "register" ? "bg-background text-primary-deep shadow-soft" : "text-muted-foreground"}`}>Register</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2"><Label htmlFor="p-name">Full Name</Label>
                  <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              )}
              {mode === "register" && (
                <div className="space-y-2"><Label htmlFor="p-phone">Phone</Label>
                  <Input id="p-phone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              )}
              <div className="space-y-2"><Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2"><Label htmlFor="p-pass">Password</Label>
                <Input id="p-pass" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <Button type="submit" size="lg" className="w-full">{mode === "login" ? "Login" : "Create Account"}</Button>
            </form>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-3xl bg-background border border-border p-8 shadow-card flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h2 className="font-display text-2xl font-bold text-primary-deep">My Dashboard</h2>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            </div>

            <div className="bg-primary-soft/30 rounded-2xl p-6 border border-primary/10 mb-8 flex items-center gap-4 shadow-sm">
              <div className="h-16 w-16 rounded-full gradient-primary text-primary-foreground font-display text-2xl font-bold grid place-items-center shadow-soft shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-primary-deep">{user.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {user.phone} {user.email && `• ${user.email}`}
                </p>
                <div className="mt-2 text-xs font-medium text-primary">
                  Patient since {fmtDate(user.registeredDate)}
                </div>
              </div>
            </div>

            <h3 className="font-display text-lg font-bold text-primary-deep mb-4">My Appointments</h3>
            
            {myAppointments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl">
                <CalendarCheck className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="font-semibold text-foreground">No appointments found</h3>
                <p className="text-sm text-muted-foreground mt-1">You haven't booked any appointments yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAppointments.map(a => (
                  <div key={a.id} className="p-4 rounded-xl border border-border space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <div className="font-semibold text-primary-deep">{a.department} • {a.doctor}</div>
                        <div className="text-sm text-muted-foreground">{fmtDate(a.date)} at {label12(a.time)}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                        a.status === 'Scheduled' ? 'bg-primary-soft text-primary-deep' :
                        a.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    {a.status === 'Scheduled' && (
                      <div className="flex gap-2 border-t border-border pt-3">
                        <Button variant="outline" size="sm" onClick={() => openReschedule(a)}>
                          <CalendarClock className="h-4 w-4 mr-1.5" /> Reschedule
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setCancelAppt(a)}>
                          <Ban className="h-4 w-4 mr-1.5" /> Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <h2 className="font-display text-2xl font-bold text-primary-deep">What you'll get</h2>
          <p className="mt-2 text-muted-foreground">Convenient self-service for every patient.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-primary-soft/60 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-primary-foreground"><f.icon className="h-5 w-5" /></div>
                <h3 className="mt-3 font-display font-bold text-primary-deep">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <ConfirmDialog
        open={!!cancelAppt}
        title="Cancel this appointment?"
        description={cancelAppt ? `${cancelAppt.department} with ${cancelAppt.doctor} on ${fmtDate(cancelAppt.date)} at ${label12(cancelAppt.time)} will be cancelled. This frees the slot for others.` : ""}
        confirmLabel="Cancel Appointment"
        onClose={() => setCancelAppt(null)}
        onConfirm={doCancel}
      />

      <Dialog open={!!resch} onOpenChange={(v) => !v && setResch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Reschedule Appointment</DialogTitle>
            <DialogDescription>
              {resch ? `${resch.department} • ${resch.doctor}` : ""} — pick a new date and time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="r-date">New Date</Label>
              <Input id="r-date" type="date" value={rDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setRDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Available Time Slots</Label>
              <div className="rounded-xl border border-border p-3 min-h-[84px]">
                {!reschDoctor ? (
                  <p className="text-sm text-muted-foreground text-center py-4">This doctor is no longer listed. Please call us to reschedule.</p>
                ) : !rDate ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Pick a date to see available times.</p>
                ) : rLoading ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
                  </div>
                ) : rSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No free slots on this date. Try another date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rSlots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRTime(s)}
                        className={cn(
                          "rounded-lg border text-xs font-semibold py-2 transition-colors",
                          rTime === s
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResch(null)}>Cancel</Button>
              <Button onClick={doReschedule} disabled={rSaving || !rTime}>
                {rSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Confirm New Time"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Portal;