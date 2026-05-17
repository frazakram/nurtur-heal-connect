import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../../lib/supabase";
import {
  mapDoctor, unmapDoctor, mapAppointment, mapPatient, mapBed,
  mapStaff, unmapStaff, mapExpense, unmapExpense, mapBill, unmapBill,
  mapInventory, unmapInventory, mapBlog, unmapBlog, mapInfo, accentToDept,
} from "../utils/dbMap";

export type Department = "Gynecology" | "Pediatrics";
export type PatientStatus = "OPD" | "IPD" | "Discharged";
export interface Patient { id: string; name: string; age: number; gender: "Male" | "Female" | "Other"; phone: string; address?: string; department: Department; doctor: string; type: "OPD" | "IPD"; status: PatientStatus; admissionDate: string; notes?: string; bedId?: string | null; }
export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
export interface Appointment { id: string; patientName: string; phone: string; doctor: string; department: Department; date: string; time: string; status: AppointmentStatus; bookingRef?: string; }
export type BedStatus = "Available" | "Occupied" | "Maintenance";
export type Ward = "General Ward (Gynecology)" | "Maternity Ward" | "Pediatrics Ward" | "NICU" | "Private Rooms";
export interface Bed { id: string; number: string; ward: Ward; status: BedStatus; patientId?: string | null; patientName?: string | null; admissionDate?: string | null; }
export type StaffRole = "Doctor" | "Nurse" | "Receptionist" | "Medical Assistant" | "Lab Technician";
export type Shift = "Morning" | "Evening" | "Night";
export interface Staff { id: string; name: string; role: StaffRole; department: string; qualification?: string; phone: string; email: string; shift: Shift; joiningDate: string; active: boolean; }
export type ExpenseCategory = "Medicines" | "Equipment" | "Salary" | "Utilities" | "Housekeeping" | "Lab Supplies" | "Miscellaneous";
export interface Expense { id: string; date: string; category: ExpenseCategory; description: string; amount: number; paidBy: string; receiptNote?: string; }
export interface BillItem { name: string; amount: number; }
export type BillStatus = "Paid" | "Pending" | "Partial";
export type PayMode = "Cash" | "UPI" | "Card" | "Insurance";
export interface Bill { id: string; patientId: string; patientName: string; department: Department; date: string; items: BillItem[]; total: number; status: BillStatus; payMode: PayMode; }
export interface InventoryItem { id: string; name: string; category: "Medicine" | "Equipment" | "Consumable"; quantity: number; unit: string; reorderLevel: number; updatedAt: string; }
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type DaySchedule = { morning: boolean; evening: boolean };
export type WeekSchedule = Record<DayKey, DaySchedule>;
export interface DoctorProfile { id: string; name: string; role: string; qualification: string; experience: string; bio?: string; languages?: string[]; img: string; accent: "gyn" | "peds"; precautions?: string; schedule?: WeekSchedule | null; }
export interface Testimonial { id: string; name: string; text: string; role: string; }
export interface BlogPost { id: string; title: string; date: string; excerpt: string; content: string; img: string; accent: "gyn" | "peds" | "primary"; author?: string; published?: boolean; }
export interface StatItem { id: string; value: string; label: string; }
export interface HospitalInfo { name: string; address: string; phone: string; email: string; }

interface State {
  patients: Patient[]; appointments: Appointment[]; beds: Bed[]; staff: Staff[];
  expenses: Expense[]; bills: Bill[]; inventory: InventoryItem[];
  info: HospitalInfo; modules: Record<string, boolean>;
  doctors: DoctorProfile[]; testimonials: Testimonial[];
  blogPosts: BlogPost[]; stats: StatItem[];
  loading: boolean; error: string | null;
}

interface Ctx extends State {
  addPatient: (p: Omit<Patient, "id" | "status">) => Promise<void>;
  updatePatient: (id: string, p: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  addAppointment: (a: Omit<Appointment, "id" | "status">) => Promise<string>;
  updateAppointment: (id: string, a: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addBed: (b: Omit<Bed, "id" | "status">) => Promise<void>;
  updateBed: (id: string, b: Partial<Bed>) => Promise<void>;
  deleteBed: (id: string) => Promise<void>;
  assignBed: (bedId: string, patientId: string) => Promise<void>;
  releaseBed: (bedId: string) => Promise<void>;
  addStaff: (s: Omit<Staff, "id" | "active">) => Promise<void>;
  updateStaff: (id: string, s: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addExpense: (e: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addBill: (b: Omit<Bill, "id">) => Promise<void>;
  updateBill: (id: string, b: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addInventory: (i: Omit<InventoryItem, "id" | "updatedAt">) => Promise<void>;
  updateInventory: (id: string, i: Partial<InventoryItem>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  updateInfo: (i: Partial<HospitalInfo>) => Promise<void>;
  toggleModule: (key: string) => void;
  resetData: () => void;
  addDoctor: (d: Omit<DoctorProfile, "id">) => Promise<void>;
  updateDoctor: (id: string, d: Partial<DoctorProfile>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  addTestimonial: (t: Omit<Testimonial, "id">) => void;
  updateTestimonial: (id: string, t: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  addBlogPost: (b: Omit<BlogPost, "id">) => Promise<void>;
  updateBlogPost: (id: string, b: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  addStat: (s: Omit<StatItem, "id">) => void;
  updateStat: (id: string, s: Partial<StatItem>) => void;
  deleteStat: (id: string) => void;
  refresh: () => Promise<void>;
}

const HospitalCtx = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_INFO: HospitalInfo = { name: "Care Hospital", address: "Khanquah Madarsa, Kabir Colony, Laxkariganj, Sasaram, Bihar 821115", phone: "+91 6205 198 966", email: "care@carehospital.in" };
const DEFAULT_MODULES: Record<string, boolean> = { patients: true, appointments: true, beds: true, staff: true, expenses: true, billing: true, inventory: true, reports: true, settings: true, blogPosts: true, messages: true, dashboard: true };
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  { id: uid(), name: "Priya S.", text: "The maternity care was exceptional. The team was kind, attentive, and made me feel safe throughout my pregnancy.", role: "New mother" },
  { id: uid(), name: "Anita K.", text: "Our baby received wonderful care in the NICU. Forever grateful to the pediatricians and nurses.", role: "Parent" },
  { id: uid(), name: "Sunita D.", text: "Modern facilities, caring doctors, and very clean. Highly recommend Care Hospital in Sasaram.", role: "Patient" },
  { id: uid(), name: "Ramesh P.", text: "Excellent pediatric care. The doctors are very patient and explain everything clearly.", role: "Father" },
];
const DEFAULT_STATS: StatItem[] = [
  { id: uid(), value: "5,000+", label: "Patients Served" },
  { id: uid(), value: "10+", label: "Years of Care" },
  { id: uid(), value: "2", label: "Specialties" },
  { id: uid(), value: "24/7", label: "Emergency Support" },
];

// Helper: look up doctor UUID by name
async function findDoctorId(name: string): Promise<string | null> {
  if (!name) return null;
  const { data } = await supabase.from("doctors").select("id").eq("name", name).maybeSingle();
  return data?.id || null;
}

export const HospitalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<State>({
    patients: [], appointments: [], beds: [], staff: [], expenses: [], bills: [],
    inventory: [], doctors: [], blogPosts: [],
    testimonials: DEFAULT_TESTIMONIALS, stats: DEFAULT_STATS,
    info: DEFAULT_INFO, modules: DEFAULT_MODULES,
    loading: true, error: null,
  });

  const fetchData = async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const [rDoc, rAppt, rBed, rStaff, rExp, rBill, rInv, rBlog, rInfo] = await Promise.all([
        supabase.from("doctors").select("*"),
        supabase.from("appointments").select("*, doctors(name)"),
        supabase.from("beds").select("*, patients(name)"),
        supabase.from("staff").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("bills").select("*, patients(name, department)"),
        supabase.from("inventory").select("*"),
        supabase.from("blog_posts").select("*"),
        supabase.from("hospital_info").select("*").limit(1).single(),
      ]);

      const beds = (rBed.data || []).map(mapBed);

      // Patients need a separate query with doctor join
      const rPat = await supabase.from("patients").select("*, doctors(name)");

      setState(s => ({
        ...s,
        doctors: (rDoc.data || []).map(mapDoctor),
        appointments: (rAppt.data || []).map(mapAppointment),
        beds,
        patients: (rPat.data || []).map((r: any) => mapPatient(r, beds)),
        staff: (rStaff.data || []).map(mapStaff),
        expenses: (rExp.data || []).map(mapExpense),
        bills: (rBill.data || []).map(mapBill),
        inventory: (rInv.data || []).map(mapInventory),
        blogPosts: (rBlog.data || []).map(mapBlog),
        info: rInfo.data ? mapInfo(rInfo.data) : DEFAULT_INFO,
        loading: false,
      }));
    } catch (err: any) {
      console.error("Fetch error:", err);
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ---- helpers ---- */
  const setArr = <K extends keyof State>(key: K, fn: (a: any[]) => any[]) =>
    setState(s => ({ ...s, [key]: fn(s[key] as any[]) }));

  /* ---- CRUD ---- */
  const ctx: Ctx = {
    ...state,
    refresh: fetchData,

    // --- Patients ---
    addPatient: async (p) => {
      const doctorId = await findDoctorId(p.doctor);
      const { data, error } = await supabase.from("patients").insert([{
        name: p.name, age: p.age, gender: p.gender, phone: p.phone, address: p.address,
        department: p.department, doctor_id: doctorId, type: p.type,
        admission_date: p.admissionDate, notes: p.notes, status: p.type,
      }]).select("*, doctors(name)").single();
      if (!error && data) {
        setArr("patients", arr => [mapPatient(data, state.beds), ...arr]);
      }
    },
    updatePatient: async (id, p) => {
      const row: any = {};
      if (p.name !== undefined) row.name = p.name;
      if (p.age !== undefined) row.age = p.age;
      if (p.gender !== undefined) row.gender = p.gender;
      if (p.phone !== undefined) row.phone = p.phone;
      if (p.address !== undefined) row.address = p.address;
      if (p.department !== undefined) row.department = p.department;
      if (p.doctor !== undefined) row.doctor_id = await findDoctorId(p.doctor);
      if (p.type !== undefined) row.type = p.type;
      if (p.status !== undefined) row.status = p.status;
      if (p.admissionDate !== undefined) row.admission_date = p.admissionDate;
      if (p.notes !== undefined) row.notes = p.notes;
      await supabase.from("patients").update(row).eq("id", id);
      setArr("patients", arr => arr.map(x => x.id === id ? { ...x, ...p } : x));
    },
    deletePatient: async (id) => {
      await supabase.from("patients").delete().eq("id", id);
      setArr("patients", arr => arr.filter(x => x.id !== id));
    },

    // --- Appointments ---
    addAppointment: async (a) => {
      const doctorId = await findDoctorId(a.doctor);
      // Goes through the SECURITY DEFINER RPC so it works whether the caller
      // is staff or an anonymous public visitor (RLS blocks direct insert).
      const { data, error } = await supabase.rpc("public_create_appointment", {
        p_patient_name: a.patientName,
        p_phone: a.phone,
        p_email: "",
        p_department: a.department,
        p_doctor_id: doctorId,
        p_date: a.date,
        p_time: a.time,
      });
      if (error || !data) return "";
      const res = data as { id: string; booking_ref: string };
      setArr("appointments", arr => [{
        id: res.id, patientName: a.patientName, phone: a.phone,
        doctor: a.doctor, department: a.department, date: a.date,
        time: a.time, status: "Scheduled" as const, bookingRef: res.booking_ref,
      }, ...arr]);
      return res.id;
    },
    updateAppointment: async (id, a) => {
      const row: any = {};
      if (a.patientName !== undefined) row.patient_name = a.patientName;
      if (a.phone !== undefined) row.phone = a.phone;
      if (a.department !== undefined) row.department = a.department;
      if (a.doctor !== undefined) row.doctor_id = await findDoctorId(a.doctor);
      if (a.date !== undefined) row.date = a.date;
      if (a.time !== undefined) row.time = a.time;
      if (a.status !== undefined) row.status = a.status;
      await supabase.from("appointments").update(row).eq("id", id);
      setArr("appointments", arr => arr.map(x => x.id === id ? { ...x, ...a } : x));
    },
    deleteAppointment: async (id) => {
      await supabase.from("appointments").delete().eq("id", id);
      setArr("appointments", arr => arr.filter(x => x.id !== id));
    },

    // --- Beds ---
    addBed: async (b) => {
      const { data, error } = await supabase.from("beds").insert([{
        bed_number: b.number, ward: b.ward, status: "Available",
      }]).select("*, patients(name)").single();
      if (!error && data) setArr("beds", arr => [...arr, mapBed(data)]);
    },
    updateBed: async (id, b) => {
      const row: any = {};
      if (b.number !== undefined) row.bed_number = b.number;
      if (b.ward !== undefined) row.ward = b.ward;
      if (b.status !== undefined) row.status = b.status;
      await supabase.from("beds").update(row).eq("id", id);
      setArr("beds", arr => arr.map(x => x.id === id ? { ...x, ...b } : x));
    },
    deleteBed: async (id) => {
      await supabase.from("beds").delete().eq("id", id);
      setArr("beds", arr => arr.filter(x => x.id !== id));
    },
    assignBed: async (bedId, patientId) => {
      const patient = state.patients.find(p => p.id === patientId);
      if (!patient) return;
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("beds").update({ status: "Occupied", patient_id: patientId, admission_date: today }).eq("id", bedId);
      fetchData();
    },
    releaseBed: async (bedId) => {
      await supabase.from("beds").update({ status: "Available", patient_id: null, admission_date: null }).eq("id", bedId);
      fetchData();
    },

    // --- Staff ---
    addStaff: async (s) => {
      const { data, error } = await supabase.from("staff").insert([{ ...unmapStaff(s), is_active: true }]).select().single();
      if (!error && data) setArr("staff", arr => [mapStaff(data), ...arr]);
    },
    updateStaff: async (id, s) => {
      await supabase.from("staff").update(unmapStaff(s)).eq("id", id);
      setArr("staff", arr => arr.map(x => x.id === id ? { ...x, ...s } : x));
    },
    deleteStaff: async (id) => {
      await supabase.from("staff").delete().eq("id", id);
      setArr("staff", arr => arr.filter(x => x.id !== id));
    },

    // --- Expenses ---
    addExpense: async (e) => {
      const { data, error } = await supabase.from("expenses").insert([unmapExpense(e)]).select().single();
      if (!error && data) setArr("expenses", arr => [mapExpense(data), ...arr]);
    },
    deleteExpense: async (id) => {
      await supabase.from("expenses").delete().eq("id", id);
      setArr("expenses", arr => arr.filter(x => x.id !== id));
    },

    // --- Bills ---
    addBill: async (b) => {
      const { data, error } = await supabase.from("bills").insert([unmapBill(b)]).select("*, patients(name, department)").single();
      if (!error && data) setArr("bills", arr => [mapBill(data), ...arr]);
    },
    updateBill: async (id, b) => {
      await supabase.from("bills").update(unmapBill(b)).eq("id", id);
      setArr("bills", arr => arr.map(x => x.id === id ? { ...x, ...b } : x));
    },
    deleteBill: async (id) => {
      await supabase.from("bills").delete().eq("id", id);
      setArr("bills", arr => arr.filter(x => x.id !== id));
    },

    // --- Inventory ---
    addInventory: async (i) => {
      const { data, error } = await supabase.from("inventory").insert([unmapInventory(i)]).select().single();
      if (!error && data) setArr("inventory", arr => [mapInventory(data), ...arr]);
    },
    updateInventory: async (id, i) => {
      await supabase.from("inventory").update(unmapInventory(i)).eq("id", id);
      setArr("inventory", arr => arr.map(x => x.id === id ? { ...x, ...i, updatedAt: new Date().toISOString() } : x));
    },
    deleteInventory: async (id) => {
      await supabase.from("inventory").delete().eq("id", id);
      setArr("inventory", arr => arr.filter(x => x.id !== id));
    },

    // --- Info ---
    updateInfo: async (i) => {
      await supabase.from("hospital_info").update(i).eq("id", (await supabase.from("hospital_info").select("id").limit(1).single()).data?.id);
      setState(s => ({ ...s, info: { ...s.info, ...i } }));
    },
    toggleModule: (key) => setState(s => ({ ...s, modules: { ...s.modules, [key]: !s.modules[key] } })),
    resetData: () => { /* no-op in Supabase mode */ },

    // --- Doctors ---
    addDoctor: async (d) => {
      const { data, error } = await supabase.from("doctors").insert([unmapDoctor(d)]).select().single();
      if (!error && data) setArr("doctors", arr => [mapDoctor(data), ...arr]);
    },
    updateDoctor: async (id, d) => {
      await supabase.from("doctors").update(unmapDoctor(d)).eq("id", id);
      setArr("doctors", arr => arr.map(x => x.id === id ? { ...x, ...d } : x));
    },
    deleteDoctor: async (id) => {
      await supabase.from("doctors").delete().eq("id", id);
      setArr("doctors", arr => arr.filter(x => x.id !== id));
    },

    // --- Testimonials (local only, no DB table) ---
    addTestimonial: (t) => setArr("testimonials", arr => [{ ...t, id: uid() }, ...arr]),
    updateTestimonial: (id, t) => setArr("testimonials", arr => arr.map(x => x.id === id ? { ...x, ...t } : x)),
    deleteTestimonial: (id) => setArr("testimonials", arr => arr.filter(x => x.id !== id)),

    // --- Blog Posts ---
    addBlogPost: async (b) => {
      const { data, error } = await supabase.from("blog_posts").insert([unmapBlog(b)]).select().single();
      if (!error && data) setArr("blogPosts", arr => [mapBlog(data), ...arr]);
    },
    updateBlogPost: async (id, b) => {
      await supabase.from("blog_posts").update(unmapBlog(b)).eq("id", id);
      setArr("blogPosts", arr => arr.map(x => x.id === id ? { ...x, ...b } : x));
    },
    deleteBlogPost: async (id) => {
      await supabase.from("blog_posts").delete().eq("id", id);
      setArr("blogPosts", arr => arr.filter(x => x.id !== id));
    },

    // --- Stats (local only, no DB table) ---
    addStat: (st) => setArr("stats", arr => [{ ...st, id: uid() }, ...arr]),
    updateStat: (id, st) => setArr("stats", arr => arr.map(x => x.id === id ? { ...x, ...st } : x)),
    deleteStat: (id) => setArr("stats", arr => arr.filter(x => x.id !== id)),
  };

  return <HospitalCtx.Provider value={ctx}>{children}</HospitalCtx.Provider>;
};

export const useHospital = () => {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
};