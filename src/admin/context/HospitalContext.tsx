import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { storage, uid } from "../utils/storage";
import { todayISO } from "../utils/formatters";

export type Department = "Gynecology" | "Pediatrics";
export type PatientStatus = "OPD" | "IPD" | "Discharged";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  address?: string;
  department: Department;
  doctor: string;
  type: "OPD" | "IPD";
  status: PatientStatus;
  admissionDate: string;
  notes?: string;
  bedId?: string | null;
}

export type AppointmentStatus = "Scheduled" | "Completed" | "Cancelled";
export interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  doctor: string;
  department: Department;
  date: string;
  time: string;
  status: AppointmentStatus;
}

export type BedStatus = "Available" | "Occupied" | "Maintenance";
export type Ward = "General Ward (Gynecology)" | "Maternity Ward" | "Pediatrics Ward" | "NICU" | "Private Rooms";
export interface Bed {
  id: string;
  number: string;
  ward: Ward;
  status: BedStatus;
  patientId?: string | null;
  patientName?: string | null;
  admissionDate?: string | null;
}

export type StaffRole = "Doctor" | "Nurse" | "Receptionist" | "Medical Assistant" | "Lab Technician";
export type Shift = "Morning" | "Evening" | "Night";
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  qualification?: string;
  phone: string;
  email: string;
  shift: Shift;
  joiningDate: string;
  active: boolean;
}

export type ExpenseCategory =
  | "Medicines" | "Equipment" | "Salary" | "Utilities" | "Housekeeping" | "Lab Supplies" | "Miscellaneous";
export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy: string;
  receiptNote?: string;
}

export interface BillItem { name: string; amount: number; }
export type BillStatus = "Paid" | "Pending" | "Partial";
export type PayMode = "Cash" | "UPI" | "Card" | "Insurance";
export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  department: Department;
  date: string;
  items: BillItem[];
  total: number;
  status: BillStatus;
  payMode: PayMode;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Medicine" | "Equipment" | "Consumable";
  quantity: number;
  unit: string;
  reorderLevel: number;
  updatedAt: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  role: string;
  qualification: string;
  experience: string;
  bio?: string;
  languages?: string[];
  img: string;
  accent: "gyn" | "peds";
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  role: string;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  img: string;
  accent: "gyn" | "peds" | "primary";
  author?: string;
  published?: boolean;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}

export interface HospitalInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface State {
  patients: Patient[];
  appointments: Appointment[];
  beds: Bed[];
  staff: Staff[];
  expenses: Expense[];
  bills: Bill[];
  inventory: InventoryItem[];
  info: HospitalInfo;
  modules: Record<string, boolean>;
  doctors: DoctorProfile[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  stats: StatItem[];
}

const KEY = "ch_hms_state_v1";

const seed = (): State => {
  const today = todayISO();
  const beds: Bed[] = [];
  const wardSpec: { ward: Ward; count: number; prefix: string }[] = [
    { ward: "General Ward (Gynecology)", count: 6, prefix: "G" },
    { ward: "Maternity Ward", count: 5, prefix: "M" },
    { ward: "Pediatrics Ward", count: 6, prefix: "P" },
    { ward: "NICU", count: 4, prefix: "N" },
    { ward: "Private Rooms", count: 4, prefix: "R" },
  ];
  wardSpec.forEach((w) => {
    for (let i = 1; i <= w.count; i++) {
      beds.push({ id: uid(), number: `${w.prefix}-${String(i).padStart(2, "0")}`, ward: w.ward, status: "Available", patientId: null, patientName: null, admissionDate: null });
    }
  });
  // mark some as occupied/maintenance
  beds[1].status = "Maintenance";
  beds[7].status = "Maintenance";

  const patients: Patient[] = [
    { id: uid(), name: "Sunita Devi", age: 28, gender: "Female", phone: "9876543210", department: "Gynecology", doctor: "Dr. Anjali Verma", type: "IPD", status: "IPD", admissionDate: today, notes: "Postpartum care", bedId: beds[0].id },
    { id: uid(), name: "Aarav Kumar", age: 4, gender: "Male", phone: "9876512345", department: "Pediatrics", doctor: "Dr. Rajeev Kumar", type: "IPD", status: "IPD", admissionDate: today, notes: "Fever observation", bedId: beds[12].id },
    { id: uid(), name: "Priya Singh", age: 32, gender: "Female", phone: "9988776655", department: "Gynecology", doctor: "Dr. Meera Singh", type: "OPD", status: "OPD", admissionDate: today, notes: "Routine checkup" },
    { id: uid(), name: "Riya Sharma", age: 6, gender: "Female", phone: "9090909090", department: "Pediatrics", doctor: "Dr. Rajeev Kumar", type: "OPD", status: "OPD", admissionDate: today, notes: "Vaccination" },
    { id: uid(), name: "Anita Yadav", age: 30, gender: "Female", phone: "9123456780", department: "Gynecology", doctor: "Dr. Anjali Verma", type: "IPD", status: "Discharged", admissionDate: "2026-04-22" },
  ];
  // attach occupied beds
  beds[0] = { ...beds[0], status: "Occupied", patientId: patients[0].id, patientName: patients[0].name, admissionDate: today };
  beds[12] = { ...beds[12], status: "Occupied", patientId: patients[1].id, patientName: patients[1].name, admissionDate: today };

  const appointments: Appointment[] = [
    { id: uid(), patientName: "Priya Singh", phone: "9988776655", doctor: "Dr. Meera Singh", department: "Gynecology", date: today, time: "10:00", status: "Scheduled" },
    { id: uid(), patientName: "Riya Sharma", phone: "9090909090", doctor: "Dr. Rajeev Kumar", department: "Pediatrics", date: today, time: "11:30", status: "Completed" },
    { id: uid(), patientName: "Neha Verma", phone: "9000000001", doctor: "Dr. Anjali Verma", department: "Gynecology", date: today, time: "14:00", status: "Scheduled" },
    { id: uid(), patientName: "Kavya Roy", phone: "9000000002", doctor: "Dr. Rajeev Kumar", department: "Pediatrics", date: today, time: "16:00", status: "Scheduled" },
  ];

  const staff: Staff[] = [
    { id: uid(), name: "Dr. Anjali Verma", role: "Doctor", department: "Gynecology", qualification: "MBBS, MD (OBG)", phone: "9000011111", email: "anjali@carehospital.in", shift: "Morning", joiningDate: "2018-06-01", active: true },
    { id: uid(), name: "Dr. Meera Singh", role: "Doctor", department: "Gynecology", qualification: "MBBS, MS", phone: "9000011112", email: "meera@carehospital.in", shift: "Evening", joiningDate: "2020-04-12", active: true },
    { id: uid(), name: "Dr. Rajeev Kumar", role: "Doctor", department: "Pediatrics", qualification: "MBBS, MD", phone: "9000011113", email: "rajeev@carehospital.in", shift: "Morning", joiningDate: "2019-09-20", active: true },
    { id: uid(), name: "Sister Asha", role: "Nurse", department: "Maternity", phone: "9000022221", email: "asha@carehospital.in", shift: "Morning", joiningDate: "2021-01-10", active: true },
    { id: uid(), name: "Reception Desk", role: "Receptionist", department: "Front Office", phone: "9000033331", email: "reception@carehospital.in", shift: "Morning", joiningDate: "2022-02-15", active: true },
    { id: uid(), name: "Ravi Kumar", role: "Medical Assistant", department: "Pediatrics", phone: "9000044441", email: "assistant@carehospital.in", shift: "Evening", joiningDate: "2023-03-01", active: true },
    { id: uid(), name: "Mahesh Lab", role: "Lab Technician", department: "Pathology", phone: "9000055551", email: "lab@carehospital.in", shift: "Morning", joiningDate: "2022-11-05", active: true },
  ];

  const expenses: Expense[] = [
    { id: uid(), date: today, category: "Medicines", description: "Antibiotics restock", amount: 8500, paidBy: "Admin" },
    { id: uid(), date: today, category: "Utilities", description: "Electricity bill", amount: 12000, paidBy: "Admin" },
    { id: uid(), date: today, category: "Housekeeping", description: "Cleaning supplies", amount: 2400, paidBy: "Admin" },
    { id: uid(), date: "2026-04-28", category: "Salary", description: "Nursing staff salary", amount: 95000, paidBy: "Admin" },
    { id: uid(), date: "2026-04-15", category: "Equipment", description: "Pulse oximeter", amount: 6500, paidBy: "Admin" },
    { id: uid(), date: "2026-04-10", category: "Lab Supplies", description: "Reagents", amount: 4200, paidBy: "Admin" },
  ];

  const bills: Bill[] = [
    { id: uid(), patientId: patients[0].id, patientName: patients[0].name, department: "Gynecology", date: today,
      items: [{ name: "Doctor Fee", amount: 800 }, { name: "Room Charges", amount: 2500 }, { name: "Medicines", amount: 1200 }],
      total: 4500, status: "Paid", payMode: "UPI" },
    { id: uid(), patientId: patients[2].id, patientName: patients[2].name, department: "Gynecology", date: today,
      items: [{ name: "Doctor Fee", amount: 600 }, { name: "Tests", amount: 900 }],
      total: 1500, status: "Pending", payMode: "Cash" },
    { id: uid(), patientId: patients[1].id, patientName: patients[1].name, department: "Pediatrics", date: today,
      items: [{ name: "Doctor Fee", amount: 700 }, { name: "Room Charges", amount: 1800 }],
      total: 2500, status: "Partial", payMode: "Card" },
  ];

  const inventory: InventoryItem[] = [
    { id: uid(), name: "Paracetamol 500mg", category: "Medicine", quantity: 240, unit: "tabs", reorderLevel: 100, updatedAt: today },
    { id: uid(), name: "Amoxicillin 250mg", category: "Medicine", quantity: 60, unit: "caps", reorderLevel: 80, updatedAt: today },
    { id: uid(), name: "Surgical Gloves", category: "Consumable", quantity: 500, unit: "pairs", reorderLevel: 200, updatedAt: today },
    { id: uid(), name: "IV Cannula", category: "Consumable", quantity: 30, unit: "pcs", reorderLevel: 50, updatedAt: today },
    { id: uid(), name: "Pulse Oximeter", category: "Equipment", quantity: 4, unit: "units", reorderLevel: 2, updatedAt: today },
    { id: uid(), name: "Syringes 5ml", category: "Consumable", quantity: 800, unit: "pcs", reorderLevel: 300, updatedAt: today },
  ];

  const doctors: DoctorProfile[] = [
    { id: uid(), name: "Dr. Anjali Verma", role: "Senior Gynecologist", qualification: "MBBS, MD (OBG)", experience: "18+ years experience", bio: "Expert in high-risk pregnancies and minimally invasive gynecological surgeries.", languages: ["English", "Hindi"], img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80", accent: "gyn" },
    { id: uid(), name: "Dr. Meera Singh", role: "Consultant Gynecologist", qualification: "MBBS, MS", experience: "10+ years experience", bio: "Passionate about women's wellness, preventive care, and painless deliveries.", languages: ["English", "Hindi", "Bhojpuri"], img: "https://images.unsplash.com/photo-1594824436998-dded4e6b23a9?w=400&q=80", accent: "gyn" },
    { id: uid(), name: "Dr. Rajeev Kumar", role: "Senior Pediatrician", qualification: "MBBS, MD (Pediatrics)", experience: "15+ years experience", bio: "Dedicated to newborn care, child development, and pediatric emergencies.", languages: ["English", "Hindi"], img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80", accent: "peds" },
  ];

  const testimonials: Testimonial[] = [
    { id: uid(), name: "Priya S.", text: "The maternity care was exceptional. The team was kind, attentive, and made me feel safe throughout my pregnancy.", role: "New mother" },
    { id: uid(), name: "Anita K.", text: "Our baby received wonderful care in the NICU. Forever grateful to the pediatricians and nurses.", role: "Parent" },
    { id: uid(), name: "Sunita D.", text: "Modern facilities, caring doctors, and very clean. Highly recommend Care Hospital in Sasaram.", role: "Patient" },
    { id: uid(), name: "Ramesh P.", text: "Excellent pediatric care. The doctors are very patient and explain everything clearly.", role: "Father" },
  ];

  const blogPosts: BlogPost[] = [
    { id: uid(), title: "10 Maternal Health Tips for a Healthy Pregnancy", date: "April 18, 2026", excerpt: "From nutrition to exercise, our gynecologists share practical, evidence-based tips to support a healthy pregnancy journey.", content: "From nutrition to exercise, our gynecologists share practical, evidence-based tips to support a healthy pregnancy journey. Staying active, taking prenatal vitamins, and attending regular checkups are key to ensuring both you and your baby remain healthy.", img: "https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=600&q=80", accent: "gyn" },
    { id: uid(), title: "Child Nutrition: What Every Parent Should Know", date: "April 5, 2026", excerpt: "Balanced meals, healthy habits, and milestones — a pediatrician's guide to feeding kids from infancy through age 12.", content: "Balanced meals, healthy habits, and milestones — a pediatrician's guide to feeding kids from infancy through age 12. Ensure they get enough protein, limit processed sugars, and establish regular family mealtimes.", img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80", accent: "peds" },
    { id: uid(), title: "The Complete Vaccination Schedule for Children", date: "March 22, 2026", excerpt: "An easy-to-follow IAP-recommended vaccination schedule and why staying on track matters for your child's immunity.", content: "An easy-to-follow IAP-recommended vaccination schedule and why staying on track matters for your child's immunity. Vaccines are safe and crucial to prevent life-threatening illnesses.", img: "https://images.unsplash.com/photo-1631556097152-c3131bf4e9b9?w=600&q=80", accent: "primary" },
    { id: uid(), title: "Understanding Postpartum Depression", date: "Feb 10, 2026", excerpt: "Recognizing the signs and knowing when to seek help after childbirth.", content: "Recognizing the signs and knowing when to seek help after childbirth. It's perfectly normal to feel overwhelmed, but persistent sadness shouldn't be ignored.", img: "https://images.unsplash.com/photo-1555252113-f9f30b91e921?w=600&q=80", accent: "gyn" },
    { id: uid(), title: "Fever in Toddlers: When to Worry", date: "Jan 15, 2026", excerpt: "A guide to managing fever at home and recognizing warning signs.", content: "A guide to managing fever at home and recognizing warning signs. Keep them hydrated, use appropriate fever reducers, and seek emergency care if the fever is persistent.", img: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&q=80", accent: "peds" },
  ];

  const stats: StatItem[] = [
    { id: uid(), value: "5,000+", label: "Patients Served" },
    { id: uid(), value: "10+", label: "Years of Care" },
    { id: uid(), value: "2", label: "Specialties" },
    { id: uid(), value: "24/7", label: "Emergency Support" },
  ];

  return {
    patients, appointments, beds, staff, expenses, bills, inventory, doctors, testimonials, blogPosts, stats,
    info: {
      name: "Care Hospital",
      address: "Mohalla - Daira, Near Fruit Market, Sasaram, District - Rohtas, Bihar - 821115",
      phone: "+91 XXXXXXXXXX",
      email: "care@carehospital.in",
    },
    modules: { patients: true, appointments: true, beds: true, staff: true, expenses: true, billing: true, inventory: true, reports: true },
  };
};

interface Ctx extends State {
  // patients
  addPatient: (p: Omit<Patient, "id" | "status">) => void;
  updatePatient: (id: string, p: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  // appointments
  addAppointment: (a: Omit<Appointment, "id" | "status">) => string;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  // beds
  addBed: (b: Omit<Bed, "id" | "status">) => void;
  updateBed: (id: string, b: Partial<Bed>) => void;
  deleteBed: (id: string) => void;
  assignBed: (bedId: string, patientId: string) => void;
  releaseBed: (bedId: string) => void;
  // staff
  addStaff: (s: Omit<Staff, "id" | "active">) => void;
  updateStaff: (id: string, s: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  // expenses
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  // bills
  addBill: (b: Omit<Bill, "id">) => void;
  updateBill: (id: string, b: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  // inventory
  addInventory: (i: Omit<InventoryItem, "id" | "updatedAt">) => void;
  updateInventory: (id: string, i: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  // info
  updateInfo: (i: Partial<HospitalInfo>) => void;
  toggleModule: (key: string) => void;
  resetData: () => void;
  addDoctor: (d: Omit<DoctorProfile, "id">) => void;
  updateDoctor: (id: string, d: Partial<DoctorProfile>) => void;
  deleteDoctor: (id: string) => void;
  addTestimonial: (t: Omit<Testimonial, "id">) => void;
  updateTestimonial: (id: string, t: Partial<Testimonial>) => void;
  deleteTestimonial: (id: string) => void;
  addBlogPost: (b: Omit<BlogPost, "id">) => void;
  updateBlogPost: (id: string, b: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  addStat: (s: Omit<StatItem, "id">) => void;
  updateStat: (id: string, s: Partial<StatItem>) => void;
  deleteStat: (id: string) => void;
}

const HospitalCtx = createContext<Ctx | null>(null);

export const HospitalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<State>(() => storage.get<State>(KEY, seed()));

  useEffect(() => { storage.set(KEY, state); }, [state]);

  const update = (fn: (s: State) => State) => setState((s) => fn(s));

  const ctx: Ctx = {
    ...state,
    addPatient: (p) => update((s) => ({ ...s, patients: [{ ...p, id: uid(), status: p.type }, ...s.patients] })),
    updatePatient: (id, p) => update((s) => ({ ...s, patients: s.patients.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
    deletePatient: (id) => update((s) => ({
      ...s,
      patients: s.patients.filter((x) => x.id !== id),
      beds: s.beds.map((b) => b.patientId === id ? { ...b, status: "Available", patientId: null, patientName: null, admissionDate: null } : b),
    })),

    addAppointment: (a) => {
      const id = uid();
      update((s) => ({ ...s, appointments: [{ ...a, id, status: "Scheduled" }, ...s.appointments] }));
      return id;
    },
    updateAppointment: (id, a) => update((s) => ({ ...s, appointments: s.appointments.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
    deleteAppointment: (id) => update((s) => ({ ...s, appointments: s.appointments.filter((x) => x.id !== id) })),

    addBed: (b) => update((s) => ({ ...s, beds: [...s.beds, { ...b, id: uid(), status: "Available", patientId: null, patientName: null, admissionDate: null }] })),
    updateBed: (id, b) => update((s) => ({ ...s, beds: s.beds.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
    deleteBed: (id) => update((s) => ({ ...s, beds: s.beds.filter((x) => x.id !== id) })),
    assignBed: (bedId, patientId) => update((s) => {
      const patient = s.patients.find((p) => p.id === patientId);
      if (!patient) return s;
      const today = todayISO();
      return {
        ...s,
        beds: s.beds.map((b) =>
          b.id === bedId
            ? { ...b, status: "Occupied", patientId, patientName: patient.name, admissionDate: today }
            : b.patientId === patientId
              ? { ...b, status: "Available", patientId: null, patientName: null, admissionDate: null }
              : b
        ),
        patients: s.patients.map((p) => p.id === patientId ? { ...p, bedId } : p),
      };
    }),
    releaseBed: (bedId) => update((s) => {
      const bed = s.beds.find((b) => b.id === bedId);
      return {
        ...s,
        beds: s.beds.map((b) => b.id === bedId ? { ...b, status: "Available", patientId: null, patientName: null, admissionDate: null } : b),
        patients: bed?.patientId ? s.patients.map((p) => p.id === bed.patientId ? { ...p, bedId: null } : p) : s.patients,
      };
    }),

    addStaff: (st) => update((s) => ({ ...s, staff: [{ ...st, id: uid(), active: true }, ...s.staff] })),
    updateStaff: (id, st) => update((s) => ({ ...s, staff: s.staff.map((x) => (x.id === id ? { ...x, ...st } : x)) })),
    deleteStaff: (id) => update((s) => ({ ...s, staff: s.staff.filter((x) => x.id !== id) })),

    addExpense: (e) => update((s) => ({ ...s, expenses: [{ ...e, id: uid() }, ...s.expenses] })),
    deleteExpense: (id) => update((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id) })),

    addBill: (b) => update((s) => ({ ...s, bills: [{ ...b, id: uid() }, ...s.bills] })),
    updateBill: (id, b) => update((s) => ({ ...s, bills: s.bills.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
    deleteBill: (id) => update((s) => ({ ...s, bills: s.bills.filter((x) => x.id !== id) })),

    addInventory: (i) => update((s) => ({ ...s, inventory: [{ ...i, id: uid(), updatedAt: todayISO() }, ...s.inventory] })),
    updateInventory: (id, i) => update((s) => ({ ...s, inventory: s.inventory.map((x) => (x.id === id ? { ...x, ...i, updatedAt: todayISO() } : x)) })),
    deleteInventory: (id) => update((s) => ({ ...s, inventory: s.inventory.filter((x) => x.id !== id) })),

    updateInfo: (i) => update((s) => ({ ...s, info: { ...s.info, ...i } })),
    toggleModule: (key) => update((s) => ({ ...s, modules: { ...s.modules, [key]: !s.modules[key] } })),
    resetData: () => setState(seed()),

    addDoctor: (d) => update((s) => ({ ...s, doctors: [{ ...d, id: uid() }, ...s.doctors] })),
    updateDoctor: (id, d) => update((s) => ({ ...s, doctors: s.doctors.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
    deleteDoctor: (id) => update((s) => ({ ...s, doctors: s.doctors.filter((x) => x.id !== id) })),

    addTestimonial: (t) => update((s) => ({ ...s, testimonials: [{ ...t, id: uid() }, ...s.testimonials] })),
    updateTestimonial: (id, t) => update((s) => ({ ...s, testimonials: s.testimonials.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
    deleteTestimonial: (id) => update((s) => ({ ...s, testimonials: s.testimonials.filter((x) => x.id !== id) })),

    addBlogPost: (b) => update((s) => ({ ...s, blogPosts: [{ ...b, id: uid() }, ...s.blogPosts] })),
    updateBlogPost: (id, b) => update((s) => ({ ...s, blogPosts: s.blogPosts.map((x) => (x.id === id ? { ...x, ...b } : x)) })),
    deleteBlogPost: (id) => update((s) => ({ ...s, blogPosts: s.blogPosts.filter((x) => x.id !== id) })),

    addStat: (st) => update((s) => ({ ...s, stats: [{ ...st, id: uid() }, ...s.stats] })),
    updateStat: (id, st) => update((s) => ({ ...s, stats: s.stats.map((x) => (x.id === id ? { ...x, ...st } : x)) })),
    deleteStat: (id) => update((s) => ({ ...s, stats: s.stats.filter((x) => x.id !== id) })),
  };

  return <HospitalCtx.Provider value={ctx}>{children}</HospitalCtx.Provider>;
};

export const useHospital = () => {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
};