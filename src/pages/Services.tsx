import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Baby, Stethoscope, Syringe, Activity, HeartPulse, Scissors, Sparkles, Users, Shield, Sprout, CalendarHeart } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DueDateCalculator = () => {
  const [lmp, setLmp] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const result = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp + "T12:00:00");
    const now = new Date(); now.setHours(12, 0, 0, 0);
    const daysSinceLmp = Math.round((now.getTime() - lmpDate.getTime()) / 86_400_000);
    if (daysSinceLmp < 0) return { error: "LMP date cannot be in the future." };
    if (daysSinceLmp > 294) return { error: "Date seems too far in the past. Please check and re-enter." };
    const weeks = Math.floor(daysSinceLmp / 7);
    const days = daysSinceLmp % 7;
    const dueDate = new Date(lmpDate.getTime() + 280 * 86_400_000);
    const daysLeft = Math.round((dueDate.getTime() - now.getTime()) / 86_400_000);
    const trimester = weeks < 13 ? 1 : weeks < 28 ? 2 : 3;
    const progress = Math.min(100, Math.round((daysSinceLmp / 280) * 100));
    const dueDateStr = dueDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const milestones = [
      { label: "End of 1st Trimester", week: 13, done: weeks >= 13 },
      { label: "Anatomy Scan (Level II)", week: 20, done: weeks >= 20 },
      { label: "End of 2nd Trimester", week: 28, done: weeks >= 28 },
      { label: "Full Term", week: 37, done: weeks >= 37 },
      { label: "Estimated Due Date", week: 40, done: weeks >= 40 },
    ];
    return { weeks, days, daysLeft, trimester, progress, dueDateStr, milestones };
  }, [lmp]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="mt-16 rounded-2xl bg-background border border-border p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl gradient-gyn shrink-0">
          <CalendarHeart className="h-5 w-5 text-gyn-strong" />
        </div>
        <h3 className="font-display text-2xl font-bold text-primary-deep">Pregnancy Due Date Calculator</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Enter the first day of your Last Menstrual Period (LMP) to get your estimated due date and pregnancy milestones.</p>

      <div className="flex flex-col sm:flex-row gap-3 max-w-md">
        <div className="flex-1 space-y-1">
          <Label htmlFor="lmp-date">First day of last period (LMP)</Label>
          <Input id="lmp-date" type="date" max={today} value={lmp} onChange={e => setLmp(e.target.value)} />
        </div>
      </div>

      {result && (
        "error" in result ? (
          <p className="mt-4 text-sm text-red-600">{result.error}</p>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-pink-50 border border-pink-100 p-4">
                <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide">Estimated Due Date</p>
                <p className="mt-1 font-display text-lg font-bold text-pink-800 leading-snug">{result.dueDateStr}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pregnancy Week</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary-deep">
                  {result.weeks}<span className="text-sm font-normal text-muted-foreground"> wk {result.days > 0 ? `${result.days}d` : ""}</span>
                </p>
                <p className="text-xs text-muted-foreground">Trimester {result.trimester}</p>
              </div>
              <div className="rounded-xl bg-secondary/40 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Days Remaining</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary-deep">
                  {result.daysLeft > 0 ? result.daysLeft : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{result.daysLeft > 0 ? "days to go" : "Past due date"}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Week 1</span><span>Week 40</span>
              </div>
              <div className="h-3 rounded-full bg-pink-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-300 to-pink-500 transition-all duration-500"
                  style={{ width: `${result.progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground text-right">{result.progress}% of pregnancy</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-primary-deep mb-3">Milestones</p>
              <div className="space-y-2">
                {result.milestones.map(m => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${m.done ? "bg-pink-500 text-white" : "bg-border text-muted-foreground"}`}>
                      {m.done ? "✓" : m.week}
                    </div>
                    <span className={`text-sm ${m.done ? "text-foreground/70 line-through" : "text-foreground"}`}>{m.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Week {m.week}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              This is an estimate based on Naegele's Rule (LMP + 280 days). Actual due date may vary. Please confirm with your doctor.
            </p>
          </div>
        )
      )}
    </motion.div>
  );
};

const gynServices = [
  { icon: HeartPulse, title: "Prenatal & Postnatal Care", text: "Holistic care before, during, and after childbirth for both mother and baby. We provide comprehensive tracking of fetal development, nutritional counseling, and postpartum recovery support to ensure a healthy journey into motherhood." },
  { icon: Baby, title: "Normal & C-Section Delivery", text: "Safe deliveries with experienced obstetricians and modern facilities. Our delivery suites are equipped with advanced fetal monitors and supported by a 24/7 anesthesia and surgical team for any emergencies." },
  { icon: Sprout, title: "Fertility Consultation", text: "Personalized guidance and treatment plans for couples planning families. From baseline hormonal evaluations to advanced reproductive advice, we support you at every step of your fertility journey." },
  { icon: Scissors, title: "Gynecological Surgeries", text: "Minimally invasive and traditional procedures by senior surgeons. We specialize in laparoscopic surgeries for fibroids, ovarian cysts, and endometriosis with rapid recovery protocols." },
  { icon: Sparkles, title: "Women's Health Checkups", text: "Comprehensive screenings and preventive care across every life stage. We offer Pap smears, mammograms, bone density scans, and menopause management tailored to your specific needs." },
];

const pedsServices = [
  { icon: Baby, title: "Newborn Care", text: "Specialized care for newborns including feeding and growth support. Our neonatologists conduct thorough newborn screening, hearing tests, and jaundice management right after birth." },
  { icon: Syringe, title: "Vaccination & Immunization", text: "Complete IAP-recommended vaccination schedules for children. We provide a comfortable, child-friendly environment and maintain detailed digital records of your child's immunization history." },
  { icon: Activity, title: "Child Growth Monitoring", text: "Regular tracking of growth milestones and developmental health. Our pediatricians assess physical, cognitive, and emotional development to ensure your child is thriving." },
  { icon: Shield, title: "Pediatric Emergency", text: "24/7 emergency response for children with rapid pediatric assessment. From high fevers to injuries, our pediatric ER is always staffed with specialists trained in child trauma." },
  { icon: Users, title: "NICU Support", text: "Neonatal intensive care for premature and critically ill newborns. Our level-III NICU features advanced incubators, ventilators, and round-the-clock intensive care nursing." },
];

const ServiceCard = ({ s, accent }: { s: any; accent: "gyn" | "peds" }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    className="rounded-2xl bg-background border border-border p-6 shadow-card hover:-translate-y-1 transition-transform flex flex-col h-full">
    <div className={`grid h-12 w-12 place-items-center rounded-xl shrink-0 ${accent === "gyn" ? "gradient-gyn text-gyn-strong" : "gradient-peds text-peds-strong"}`}>
      <s.icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 font-display text-lg font-bold text-primary-deep shrink-0">{s.title}</h3>
    <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{s.text}</p>
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
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-gyn shrink-0"><Stethoscope className="h-6 w-6 text-gyn-strong" /></div>
        <h2 className="font-display text-3xl font-bold text-primary-deep">Gynecology</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {gynServices.map((s) => <ServiceCard key={s.title} s={s} accent="gyn" />)}
      </div>
      
      <DueDateCalculator />

      <div className="mt-16 bg-background border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="font-display text-2xl font-bold text-primary-deep mb-6">Common Questions: Gynecology</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left font-semibold">When should I schedule my first prenatal visit?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">We recommend scheduling your first prenatal visit around 8 weeks after your last menstrual period. Early care is crucial for establishing a baseline for your health and the baby's development.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left font-semibold">Do you offer painless delivery options?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">Yes, we provide epidural analgesia administered by expert anesthesiologists to ensure a comfortable and painless labor experience.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left font-semibold">Are minimally invasive surgeries available here?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">Absolutely. We regularly perform laparoscopic (keyhole) surgeries for conditions like fibroids, cysts, and hysterectomies, which result in less pain and faster recovery.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>

    <section className="container py-16">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl gradient-peds shrink-0"><Baby className="h-6 w-6 text-peds-strong" /></div>
        <h2 className="font-display text-3xl font-bold text-primary-deep">Pediatrics</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
        {pedsServices.map((s) => <ServiceCard key={s.title} s={s} accent="peds" />)}
      </div>

      <div className="mt-16 bg-background border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="font-display text-2xl font-bold text-primary-deep mb-6">Common Questions: Pediatrics</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left font-semibold">At what age should my child first see a pediatrician?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">Your baby should be seen by a pediatrician within 3 to 5 days after birth for a newborn wellness check to monitor feeding, weight, and check for jaundice.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left font-semibold">Do you provide all mandatory vaccinations?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">Yes, we offer all standard vaccinations as per the guidelines of the Indian Academy of Pediatrics (IAP), as well as optional vaccines based on your child's needs.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left font-semibold">Can parents stay with their child in the pediatric ward?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">We highly encourage parental involvement. Our pediatric wards are designed with accommodations to allow one parent to stay comfortably with their admitted child.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  </>
);

export default Services;