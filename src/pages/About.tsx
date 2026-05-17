import { motion } from "framer-motion";
import { Heart, Sparkles, Shield, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useHospital } from "../admin/context/HospitalContext";
import hospitalPhoto from "@/assets/hospital.jpg";

const values = [
  { icon: Heart, title: "Compassion", text: "We treat every patient like family — with empathy, patience, and warmth." },
  { icon: Sparkles, title: "Excellence", text: "We pursue the highest standards of clinical care and outcomes." },
  { icon: Shield, title: "Trust", text: "Transparent, ethical care that families can rely on across generations." },
];

const milestones = [
  { year: "2010", title: "Hospital Founded", text: "Opened as a small clinic in Sasaram with a vision to serve families." },
  { year: "2014", title: "First 1,000 Deliveries", text: "Reached a major milestone of safe deliveries, cementing trust in the region." },
  { year: "2018", title: "Pediatrics Wing Opened", text: "Expanded our services with a dedicated pediatric ward and Level-II NICU." },
  { year: "2023", title: "Advanced NICU Upgrades", text: "Upgraded to Level-III NICU to handle extreme premature and high-risk newborn cases." },
];

const About = () => {
  const { info } = useHospital();
  
  return (
  <>
    <SEO title={`About ${info.name} | Sasaram, Bihar`} description={`Learn about ${info.name}'s mission, vision, and values — specialty care for mothers and children in Sasaram.`} />
    <section className="gradient-hero">
      <div className="container py-20 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl md:text-5xl font-bold text-primary-deep">
          About {info.name}
        </motion.h1>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Specialty care, rooted in compassion — serving families in Sasaram and beyond.</p>
      </div>
    </section>

    <section className="container py-16 grid gap-10 md:grid-cols-2 items-center">
      <motion.img initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
        src={hospitalPhoto} alt="Care Hospital building" className="rounded-3xl shadow-card w-full h-[400px] object-cover" />
      <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
        <h2 className="font-display text-3xl font-bold text-primary-deep">Our Story</h2>
        <p className="mt-4 text-foreground/70 leading-relaxed">
          Founded with a single purpose — to make quality maternal and child healthcare accessible in Sasaram — {info.name} has grown into a trusted name across Rohtas district. Located at {info.address}, our specialty focus on Gynecology and Pediatrics allows us to deliver deep expertise where it matters most.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-primary-soft p-6">
            <h3 className="font-display font-bold text-primary-deep">Our Mission</h3>
            <p className="mt-2 text-sm text-foreground/70">To provide compassionate, world-class care for mothers and children — close to home.</p>
          </div>
          <div className="rounded-2xl gradient-gyn p-6">
            <h3 className="font-display font-bold text-primary-deep">Our Vision</h3>
            <p className="mt-2 text-sm text-foreground/70">To be Bihar's most trusted specialty hospital for women's and children's health.</p>
          </div>
        </div>
      </motion.div>
    </section>

    <section className="bg-primary-soft/40 py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">Our Values</h2>
          <p className="mt-3 text-muted-foreground">The principles that guide every decision we make.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-background p-8 shadow-card text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground"><v.icon className="h-7 w-7" /></div>
              <h3 className="mt-5 font-display text-xl font-bold text-primary-deep">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Milestones */}
    <section className="container py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-deep">Our Journey</h2>
        <p className="mt-3 text-muted-foreground">Milestones in our mission to care for the community.</p>
      </div>
      <div className="relative max-w-3xl mx-auto">
        <div className="absolute left-[20px] sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
        <div className="space-y-12">
          {milestones.map((m, i) => (
            <motion.div key={m.year} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 ${i % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
              <div className="absolute left-[20px] sm:left-1/2 w-4 h-4 rounded-full bg-primary -translate-x-[7px] sm:-translate-x-1/2 ring-4 ring-background" />
              <div className="pl-12 sm:pl-0 sm:w-1/2" />
              <div className="pl-12 sm:pl-0 sm:w-1/2">
                <div className="rounded-2xl bg-background p-6 shadow-sm border border-border">
                  <div className="text-primary font-bold text-lg">{m.year}</div>
                  <h4 className="font-display font-bold text-primary-deep mt-1">{m.title}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{m.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="container py-16">
      <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&q=80" alt="Our care team" className="rounded-3xl shadow-card w-full h-[400px] object-cover" />
    </section>
  </>
  );
};

export default About;