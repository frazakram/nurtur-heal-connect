import { motion } from "framer-motion";
import { GraduationCap, Briefcase } from "lucide-react";
import { AppointmentModal } from "@/components/AppointmentModal";
import { SEO } from "@/components/SEO";
import { useHospital } from "../admin/context/HospitalContext";
import type { DayKey, WeekSchedule } from "../admin/context/HospitalContext";

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayKey, string> = { mon: "Mo", tue: "Tu", wed: "We", thu: "Th", fri: "Fr", sat: "Sa", sun: "Su" };

const Doctors = () => {
  const { doctors } = useHospital();
  
  return (
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
          <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="group rounded-3xl bg-background border border-border overflow-hidden shadow-card hover:shadow-glow transition-shadow">
            <div className={`relative ${d.accent === "gyn" ? "gradient-gyn" : "gradient-peds"} p-6`}>
              <img src={d.img} alt={d.name} className="mx-auto h-44 w-44 rounded-full object-cover object-[center_35%] border-4 border-background shadow-card" />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-display text-xl font-bold text-primary-deep">{d.name}</h3>
              <p className="text-sm font-semibold text-primary mt-1">{d.role}</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2"><GraduationCap className="h-4 w-4" /> {d.qualification}</div>
                <div className="flex items-center justify-center gap-2"><Briefcase className="h-4 w-4" /> {d.experience}</div>
              </div>
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed text-left border-t border-border pt-3">
                {d.bio}
              </p>
              {d.languages && (
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  {d.languages.map(lang => (
                    <span key={lang} className="text-xs font-medium bg-secondary text-primary-deep px-2 py-0.5 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
              {d.schedule && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-primary-deep mb-2 text-left">OPD Availability</p>
                  <div className="grid grid-cols-7 gap-0.5">
                    {DAYS.map(day => {
                      const s = (d.schedule as WeekSchedule)[day];
                      return (
                        <div key={day} className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground">{DAY_LABEL[day]}</span>
                          <div title="Morning" className={`h-1.5 w-full rounded-sm ${s?.morning ? (d.accent === "gyn" ? "bg-pink-400" : "bg-sky-400") : "bg-border"}`} />
                          <div title="Evening" className={`h-1.5 w-full rounded-sm ${s?.evening ? (d.accent === "gyn" ? "bg-pink-600" : "bg-sky-600") : "bg-border"}`} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-sm bg-foreground/20" />Morning</span>
                    <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-3 rounded-sm bg-foreground/50" />Evening</span>
                  </div>
                </div>
              )}
              <div className="mt-6">
                <AppointmentModal defaultDoctor={d.name} defaultDepartment={d.accent === 'gyn' ? 'Gynecology' : 'Pediatrics'} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  </>
  );
};

export default Doctors;