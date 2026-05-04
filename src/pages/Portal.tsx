import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, FileText, History, Pill, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { useHospital } from "../admin/context/HospitalContext";
import { fmtDate } from "../admin/utils/formatters";
import { supabase } from "../lib/supabase";

const features = [
  { icon: CalendarCheck, title: "View Appointments", text: "See upcoming and past appointments at a glance." },
  { icon: FileText, title: "Download Reports", text: "Access your lab reports and discharge summaries." },
  { icon: History, title: "Medical History", text: "A consolidated view of your visits and diagnoses." },
  { icon: Pill, title: "Prescription Records", text: "Refer to active and past prescriptions anytime." },
];

const Portal = () => {
  const { appointments } = useHospital();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<{ name: string; phone: string; email?: string; registeredDate: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });

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
      } else {
        toast.success("Account created successfully!");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
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

  const myAppointments = appointments.filter(a => user && a.phone === user.phone);

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
                  <div key={a.id} className="p-4 rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-primary-deep">{a.department} • {a.doctor}</div>
                      <div className="text-sm text-muted-foreground">{fmtDate(a.date)} at {a.time}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      a.status === 'Scheduled' ? 'bg-primary-soft text-primary-deep' :
                      a.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {a.status}
                    </span>
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
    </>
  );
};

export default Portal;