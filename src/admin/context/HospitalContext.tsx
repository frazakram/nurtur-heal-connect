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

  return {
    patients, appointments, beds, staff, expenses, bills, inventory,
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
  addAppointment: (a: Omit<Appointment, "id" | "status">) => void;
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

    addAppointment: (a) => update((s) => ({ ...s, appointments: [{ ...a, id: uid(), status: "Scheduled" }, ...s.appointments] })),
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
  };

  return <HospitalCtx.Provider value={ctx}>{children}</HospitalCtx.Provider>;
};

export const useHospital = () => {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error("useHospital must be used inside HospitalProvider");
  return ctx;
};