import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Baby, Stethoscope, ShieldCheck, Clock, Award, HeartHandshake, ArrowRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "@/components/AppointmentModal";
import { SEO } from "@/components/SEO";

const why = [
  { icon: Award, title: "Experienced Doctors", text: "Senior specialists with deep expertise in maternal and child health." },
  { icon: Clock, title: "24/7 Emergency Care", text: "Round-the-clock support when every minute matters." },
  { icon: ShieldCheck, title: "Modern Equipment", text: "Advanced diagnostic and surgical facilities under one roof." },
  { icon: HeartHandshake, title: "Compassionate Staff", text: "Warm, family-first care for mothers and children." },
];

import { useHospital } from "../admin/context/HospitalContext";

const AnimatedCounter = ({ value }: { value: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (!isInView || !ref.current) return;
    const numMatch = value.match(/\d+,?\d*/);
    if (!numMatch) {
      ref.current.textContent = value;
      return;
    }
    const numStr = numMatch[0].replace(/,/g, '');
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return;
    
    const controls = animate(0, num, {
      duration: 2,
      ease: "easeOut",
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = value.replace(numMatch[0], Math.floor(v).toLocaleString());
        }
      }
    });
    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={ref}>{value}</span>;
};

const Home = () => {
  const { stats, testimonials, doctors } = useHospital();
  
  return (
  <>
    <SEO title="Care Hospital — Caring for Mothers & Children" description="Specialty Gynecology & Pediatrics hospital in Sasaram, Bihar. Compassionate doctors and 24/7 emergency care." />

    {/* Hero */}
    <section className="relative overflow-hidden gradient-hero">
      <div className="container relative grid gap-10 py-20 md:py-28 md:grid-cols-2 md:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-1.5 text-xs font-semibold text-primary-deep shadow-soft backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Sasaram, Bihar
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold leading-tight text-primary-deep">
            Caring for <span className="text-gyn-strong">Mothers</span> &amp; <span className="text-peds-strong">Children</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-foreground/70">
            A specialty hospital dedicated to gynecology and pediatrics — where compassionate care meets modern medicine.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <AppointmentModal size="lg" />
            <Button asChild size="lg" variant="outline" className="border-primary-deep text-primary-deep">
              <Link to="/services">Explore Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80" alt="Mother and child care" className="rounded-3xl shadow-card w-full h-[400px] md:h-[500px] object-cover" loading="eager" />
          <div className="absolute -bottom-6 -left-6 hidden md:flex items-center gap-3 rounded-2xl bg-background p-4 shadow-card">
            <div className="grid h-12 w-12 place-items-center rounded-xl gradient-gyn"><HeartHandshake className="h-6 w-6 text-gyn-strong" /></div>
            <div>
              <div className="font-display font-bold text-primary-deep">Trusted Care</div>
              <div className="text-xs text-muted-foreground">By thousands of families</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Specialties */}
    <section className="container py-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">Our Specialties</h2>
        <p className="mt-3 text-muted-foreground">Focused expertise where it matters most.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[
          { icon: Stethoscope, title: "Gynecology", text: "Comprehensive women's health from prenatal to postnatal care, deliveries, and surgical services.", grad: "gradient-gyn", color: "text-gyn-strong" },
          { icon: Baby, title: "Pediatrics", text: "Newborn care, vaccinations, growth monitoring, and pediatric emergency support with NICU.", grad: "gradient-peds", color: "text-peds-strong" },
        ].map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`group relative overflow-hidden rounded-3xl ${s.grad} p-8 shadow-card hover:shadow-glow transition-shadow`}>
            <s.icon className={`h-12 w-12 ${s.color}`} />
            <h3 className="mt-5 font-display text-2xl font-bold text-primary-deep">{s.title}</h3>
            <p className="mt-2 text-foreground/70">{s.text}</p>
            <Link to="/services" className="mt-5 inline-flex items-center gap-2 font-semibold text-primary-deep hover:gap-3 transition-all">
              Learn more <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Why Choose Us */}
    <section className="bg-primary-soft/40 py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">Why Choose Care Hospital</h2>
          <p className="mt-3 text-muted-foreground">Reasons families across Rohtas trust us with their loved ones.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((w, i) => (
            <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-background p-6 shadow-card hover:-translate-y-1 transition-transform">
              <div className="grid h-12 w-12 place-items-center rounded-xl gradient-primary text-primary-foreground"><w.icon className="h-6 w-6" /></div>
              <h3 className="mt-4 font-display font-bold text-primary-deep">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="container py-20">
      <div className="rounded-3xl gradient-primary p-10 text-primary-foreground shadow-glow">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
          {stats.map((s) => (
            <div key={s.id || s.label}>
              <div className="font-display text-4xl md:text-5xl font-bold"><AnimatedCounter value={s.value} /></div>
              <div className="mt-2 text-sm opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="container py-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">What Families Say</h2>
        <p className="mt-3 text-muted-foreground">Real stories from the patients we serve.</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <Quote className="h-8 w-8 text-primary/40" />
            <p className="mt-3 text-foreground/80 leading-relaxed">"{t.text}"</p>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-gyn font-display font-bold text-gyn-foreground">{t.name[0]}</div>
              <div>
                <div className="font-semibold text-primary-deep">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
              <div className="ml-auto flex gap-0.5 text-peds-strong">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Featured Doctors */}
    <section className="bg-primary-soft/40 py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">Featured Specialists</h2>
          <p className="mt-3 text-muted-foreground">Expert care from our renowned medical team.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {doctors.slice(0, 3).map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group rounded-3xl bg-background border border-border overflow-hidden shadow-card hover:-translate-y-1 transition-transform">
              <div className={`relative ${d.accent === "gyn" ? "gradient-gyn" : "gradient-peds"} p-6`}>
                <img src={d.img} alt={d.name} className="mx-auto h-32 w-32 rounded-full object-cover object-[center_10%] border-4 border-background shadow-card" />
              </div>
              <div className="p-6 text-center">
                <h3 className="font-display text-lg font-bold text-primary-deep">{d.name}</h3>
                <p className="text-xs font-semibold text-primary mt-1">{d.role}</p>
                <Button asChild variant="ghost" className="mt-4 text-primary-deep hover:bg-secondary">
                  <Link to="/doctors">View Profile <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA Banner */}
    <section className="container pb-20">
      <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 md:p-14 text-center shadow-card">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">
          Your health is our priority
        </h2>
        <p className="mt-3 text-foreground/70 max-w-xl mx-auto">Book a consultation today and experience care that puts you and your family first.</p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <AppointmentModal size="lg" />
          <Button asChild size="lg" variant="outline" className="border-primary-deep text-primary-deep">
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  </>
  );
};

export default Home;