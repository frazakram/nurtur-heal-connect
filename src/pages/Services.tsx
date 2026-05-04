import { motion } from "framer-motion";
import { Baby, Stethoscope, Syringe, Activity, HeartPulse, Scissors, Sparkles, Users, Shield, Sprout } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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