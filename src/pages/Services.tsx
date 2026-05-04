import { motion } from "framer-motion";
import { Baby, Stethoscope, Syringe, Activity, HeartPulse, Scissors, Sparkles, Users, Shield, Sprout } from "lucide-react";
import { SEO } from "@/components/SEO";

const gynServices = [
  { icon: HeartPulse, title: "Prenatal & Postnatal Care", text: "Holistic care before, during, and after childbirth for both mother and baby." },
  { icon: Baby, title: "Normal & C-Section Delivery", text: "Safe deliveries with experienced obstetricians and modern facilities." },
  { icon: Sprout, title: "Fertility Consultation", text: "Personalized guidance and treatment plans for couples planning families." },
  { icon: Scissors, title: "Gynecological Surgeries", text: "Minimally invasive and traditional procedures by senior surgeons." },
  { icon: Sparkles, title: "Women's Health Checkups", text: "Comprehensive screenings and preventive care across every life stage." },
];

const pedsServices = [
  { icon: Baby, title: "Newborn Care", text: "Specialized care for newborns including feeding and growth support." },
  { icon: Syringe, title: "Vaccination & Immunization", text: "Complete IAP-recommended vaccination schedules for children." },
  { icon: Activity, title: "Child Growth Monitoring", text: "Regular tracking of growth milestones and developmental health." },
  { icon: Shield, title: "Pediatric Emergency", text: "24/7 emergency response for children with rapid pediatric assessment." },
  { icon: Users, title: "NICU Support", text: "Neonatal intensive care for premature and critically ill newborns." },
];

const ServiceCard = ({ s, accent }: { s: any; accent: "gyn" | "peds" }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    className="rounded-2xl bg-background border border-border p-6 shadow-card hover:-translate-y-1 transition-transform">
    <div className={`grid h-12 w-12 place-items-center rounded-xl ${accent === "gyn" ? "gradient-gyn text-gyn-strong" : "gradient-peds text-peds-strong"}`}>
      <s.icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 font-display text-lg font-bold text-primary-deep">{s.title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
  </motion.div>
);

const Services = () => (
  <>
    <SEO title="Services — Gynecology & Pediatrics | Care Hospital" description="Explore our specialty services in gynecology, obstetrics, and pediatric care at Care Hospital, Sasaram." />

    <section className="gradient-hero">
      <div className="container py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Our Services</h1>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Specialty care for every stage of motherhood and childhood.</p>
      </div>
    </section>

    <section className="container py-16">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-gyn"><Stethoscope className="h-6 w-6 text-gyn-strong" /></div>
        <h2 className="font-display text-3xl font-bold text-primary-deep">Gynecology</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gynServices.map((s) => <ServiceCard key={s.title} s={s} accent="gyn" />)}
      </div>
    </section>

    <section className="container py-16">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-peds"><Baby className="h-6 w-6 text-peds-strong" /></div>
        <h2 className="font-display text-3xl font-bold text-primary-deep">Pediatrics</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pedsServices.map((s) => <ServiceCard key={s.title} s={s} accent="peds" />)}
      </div>
    </section>
  </>
);

export default Services;