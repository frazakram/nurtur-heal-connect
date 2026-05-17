// Maps between snake_case DB columns and camelCase frontend interfaces

export const deptToAccent = (d: string | null): "gyn" | "peds" =>
  d === "Pediatrics" ? "peds" : "gyn";
export const accentToDept = (a: string): string =>
  a === "peds" ? "Pediatrics" : "Gynecology";
export const catToAccent = (c: string | null): "gyn" | "peds" | "primary" =>
  c === "Gynecology" ? "gyn" : c === "Pediatrics" ? "peds" : "primary";
export const accentToCat = (a: string): string =>
  a === "gyn" ? "Gynecology" : a === "peds" ? "Pediatrics" : "General";

export const mapDoctor = (r: any) => ({
  id: r.id, name: r.name, role: r.role || "", qualification: r.qualification || "",
  experience: r.experience || "", bio: r.bio || "", languages: r.languages || [],
  img: r.photo || "", accent: deptToAccent(r.department), precautions: r.precautions || "",
  schedule: r.schedule ?? null,
});
export const unmapDoctor = (d: any) => {
  const o: any = {};
  if (d.name !== undefined) o.name = d.name;
  if (d.role !== undefined) o.role = d.role;
  if (d.qualification !== undefined) o.qualification = d.qualification;
  if (d.experience !== undefined) o.experience = d.experience;
  if (d.bio !== undefined) o.bio = d.bio;
  if (d.languages !== undefined) o.languages = d.languages;
  if (d.img !== undefined) o.photo = d.img;
  if (d.accent !== undefined) o.department = accentToDept(d.accent);
  if (d.precautions !== undefined) o.precautions = d.precautions;
  if (d.schedule !== undefined) o.schedule = d.schedule;
  return o;
};

export const mapAppointment = (r: any) => ({
  id: r.id, patientName: r.patient_name, phone: r.phone || "",
  doctor: r.doctors?.name || r.doctor_name || "", department: r.department || "Gynecology",
  date: r.date || "", time: r.time || "", status: r.status || "Scheduled",
  bookingRef: r.booking_ref || "",
});

export const mapPatient = (r: any, beds: any[]) => {
  const bed = beds.find((b: any) => b.patientId === r.id);
  return {
    id: r.id, name: r.name, age: r.age, gender: r.gender, phone: r.phone || "",
    address: r.address || "", department: r.department || "Gynecology",
    doctor: r.doctors?.name || "", type: r.type || "OPD",
    status: r.status || "Active", admissionDate: r.admission_date || "",
    notes: r.notes || "", bedId: bed?.id || null,
  };
};

export const mapBed = (r: any) => ({
  id: r.id, number: r.bed_number, ward: r.ward, status: r.status,
  patientId: r.patient_id || null, patientName: r.patients?.name || null,
  admissionDate: r.admission_date || null,
});

export const mapStaff = (r: any) => ({
  id: r.id, name: r.name, role: r.role, department: r.department || "",
  qualification: "", phone: r.phone || "", email: r.email || "",
  shift: r.shift || "Morning", joiningDate: r.joining_date || "", active: r.is_active ?? true,
});
export const unmapStaff = (s: any) => {
  const o: any = {};
  if (s.name !== undefined) o.name = s.name;
  if (s.role !== undefined) o.role = s.role;
  if (s.department !== undefined) o.department = s.department;
  if (s.phone !== undefined) o.phone = s.phone;
  if (s.email !== undefined) o.email = s.email;
  if (s.shift !== undefined) o.shift = s.shift;
  if (s.joiningDate !== undefined) o.joining_date = s.joiningDate;
  if (s.active !== undefined) o.is_active = s.active;
  return o;
};

export const mapExpense = (r: any) => ({
  id: r.id, date: r.date, category: r.category, description: r.description || "",
  amount: Number(r.amount) || 0, paidBy: r.paid_by || "", receiptNote: r.receipt_note || "",
});
export const unmapExpense = (e: any) => {
  const o: any = {};
  if (e.date !== undefined) o.date = e.date;
  if (e.category !== undefined) o.category = e.category;
  if (e.description !== undefined) o.description = e.description;
  if (e.amount !== undefined) o.amount = e.amount;
  if (e.paidBy !== undefined) o.paid_by = e.paidBy;
  if (e.receiptNote !== undefined) o.receipt_note = e.receiptNote;
  return o;
};

export const mapBill = (r: any) => ({
  id: r.id, patientId: r.patient_id || "", patientName: r.patient_name || r.patients?.name || "",
  department: (r.patients?.department || "Gynecology") as any,
  date: r.created_at?.split("T")[0] || "", items: r.items || [],
  total: Number(r.total_amount) || 0, status: r.status || "Pending",
  payMode: r.payment_mode || "Cash",
});
export const unmapBill = (b: any) => {
  const o: any = {};
  if (b.patientId !== undefined) o.patient_id = b.patientId;
  if (b.patientName !== undefined) o.patient_name = b.patientName;
  if (b.items !== undefined) o.items = b.items;
  if (b.total !== undefined) o.total_amount = b.total;
  if (b.status !== undefined) o.status = b.status;
  if (b.payMode !== undefined) o.payment_mode = b.payMode;
  return o;
};

export const mapInventory = (r: any) => ({
  id: r.id, name: r.name, category: r.category, quantity: r.quantity,
  unit: r.unit || "", reorderLevel: r.reorder_level || 10,
  updatedAt: r.updated_at || "",
});
export const unmapInventory = (i: any) => {
  const o: any = {};
  if (i.name !== undefined) o.name = i.name;
  if (i.category !== undefined) o.category = i.category;
  if (i.quantity !== undefined) o.quantity = i.quantity;
  if (i.unit !== undefined) o.unit = i.unit;
  if (i.reorderLevel !== undefined) o.reorder_level = i.reorderLevel;
  o.updated_at = new Date().toISOString();
  return o;
};

export const mapBlog = (r: any) => ({
  id: r.id, title: r.title, date: r.created_at?.split("T")[0] || "",
  excerpt: r.excerpt || "", content: r.content || "", img: r.cover_image || "",
  accent: catToAccent(r.category), author: r.author || "", published: !r.is_draft,
});
export const unmapBlog = (b: any) => {
  const o: any = {};
  if (b.title !== undefined) o.title = b.title;
  if (b.excerpt !== undefined) o.excerpt = b.excerpt;
  if (b.content !== undefined) o.content = b.content;
  if (b.img !== undefined) o.cover_image = b.img;
  if (b.accent !== undefined) o.category = accentToCat(b.accent);
  if (b.author !== undefined) o.author = b.author;
  if (b.published !== undefined) o.is_draft = !b.published;
  return o;
};

export const mapMessage = (r: any) => ({
  id: r.id, name: r.name || "", phone: r.phone || "", email: r.email || "",
  message: r.message || "", date: r.created_at || "", read: r.is_read ?? false,
});

export const mapInfo = (r: any) => ({
  name: r.name || "Care Hospital",
  address: r.address || "",
  phone: r.phone || "",
  email: r.email || "",
});
