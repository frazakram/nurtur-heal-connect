import { motion } from "framer-motion";
import { GraduationCap, Briefcase } from "lucide-react";
import { AppointmentModal } from "@/components/AppointmentModal";
import { SEO } from "@/components/SEO";

const doctors = [
  { name: "Dr. Anjali Verma", role: "Senior Gynecologist", qual: "MBBS, MD (OBG)", exp: "18+ years experience", img: "https://placehold.co/400x400/FCE7F3/9D174D?text=Dr.+Anjali", accent: "gyn" },
  { name: "Dr. Meera Singh", role: "Consultant Gynecologist", qual: "MBBS, MS", exp: "10+ years experience", img: "https://placehold.co/400x400/FCE7F3/9D174D?text=Dr.+Meera", accent: "gyn" },
  { name: "Dr. Rajeev Kumar", role: "Senior Pediatrician", qual: "MBBS, MD (Pediatrics)", exp: "15+ years experience", img: "https://placehold.co/400x400/FEF9C3/854D0E?text=Dr.+Rajeev", accent: "peds" },
];

const Doctors = () => (
  <>
    <SEO title="Our Doctors | Care Hospital, Sasaram" description="Meet the senior gynecologists and pediatricians at Care Hospital, Sasaram." />

    <section className="gradient-hero">
      <div className="container py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Meet Our Doctors</h1>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Senior specialists committed to your family's well-being.</p>
      </div>
    </section>

    <section className="container py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group rounded-3xl bg-background border border-border overflow-hidden shadow-card hover:shadow-glow transition-shadow">
            <div className={`relative ${d.accent === "gyn" ? "gradient-gyn" : "gradient-peds"} p-6`}>
              <img src={d.img} alt={d.name} className="mx-auto h-44 w-44 rounded-full object-cover border-4 border-background shadow-card" />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-display text-xl font-bold text-primary-deep">{d.name}</h3>
              <p className="text-sm font-semibold text-primary mt-1">{d.role}</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2"><GraduationCap className="h-4 w-4" /> {d.qual}</div>
                <div className="flex items-center justify-center gap-2"><Briefcase className="h-4 w-4" /> {d.exp}</div>
              </div>
              <div className="mt-6">
                <AppointmentModal />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  </>
);

export default Doctors;