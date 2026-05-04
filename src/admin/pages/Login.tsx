import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HeartPulse, ShieldCheck, ArrowLeft } from "lucide-react";

const Login = () => {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/admin/dashboard", { replace: true }); }, [user, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = login(email, password);
    setLoading(false);
    if (!res.ok) { toast.error(res.error ?? "Login failed"); return; }
    toast.success(`Welcome, ${res.user!.name}`);
    nav("/admin/dashboard", { replace: true });
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative gradient-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><HeartPulse className="h-5 w-5" /></span>
          Care Hospital
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold leading-tight">Hospital Management System</h2>
          <p className="mt-3 text-white/80 max-w-md">Securely manage patients, appointments, beds, billing, and more — all in one place.</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/80"><ShieldCheck className="h-4 w-4" /> Internal staff portal</div>
        </div>
        <div className="text-xs text-white/60 relative z-10">© {new Date().getFullYear()} Care Hospital, Sasaram</div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary-deep mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to website
          </Link>
          <h1 className="font-display text-3xl font-bold text-primary-deep">Staff Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access the HMS.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="l-email">Email</Label>
              <Input id="l-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@carehospital.in" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-pass">Password</Label>
              <Input id="l-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</Button>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Demo credentials</div>
            <div className="space-y-1.5 text-sm">
              {[
                { r: "Admin", e: "admin@carehospital.in", p: "admin123" },
                { r: "Receptionist", e: "reception@carehospital.in", p: "recep123" },
                { r: "Med. Assistant", e: "assistant@carehospital.in", p: "assist123" },
              ].map((c) => (
                <button key={c.e} type="button" onClick={() => fill(c.e, c.p)}
                  className="w-full text-left flex justify-between items-center rounded-lg px-3 py-2 hover:bg-background transition-colors">
                  <span className="font-medium text-primary-deep">{c.r}</span>
                  <span className="text-xs text-muted-foreground">{c.e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;