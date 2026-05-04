import re

with open('src/admin/context/HospitalContext.tsx', 'r') as f:
    content = f.read()

# 1. Add Interfaces
interfaces = """export interface InventoryItem {
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
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
}"""
content = re.sub(r'export interface InventoryItem \{[\s\S]*?updatedAt: string;\n\}', interfaces, content)

# 2. Add to State
state_str = """  info: HospitalInfo;
  modules: Record<string, boolean>;
  doctors: DoctorProfile[];
  testimonials: Testimonial[];
  blogPosts: BlogPost[];
  stats: StatItem[];
}"""
content = re.sub(r'  info: HospitalInfo;\n  modules: Record<string, boolean>;\n\}', state_str, content)

# 3. Add to Ctx
ctx_str = """  updateInfo: (i: Partial<HospitalInfo>) => void;
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
}"""
content = re.sub(r'  updateInfo: \(i: Partial<HospitalInfo>\) => void;\n  toggleModule: \(key: string\) => void;\n  resetData: \(\) => void;\n\}', ctx_str, content)

# 4. Add Seed Data
seed_str = """  const inventory: InventoryItem[] = [
    { id: uid(), name: "Paracetamol 500mg", category: "Medicine", quantity: 240, unit: "tabs", reorderLevel: 100, updatedAt: today },
    { id: uid(), name: "Amoxicillin 250mg", category: "Medicine", quantity: 60, unit: "caps", reorderLevel: 80, updatedAt: today },
    { id: uid(), name: "Surgical Gloves", category: "Consumable", quantity: 500, unit: "pairs", reorderLevel: 200, updatedAt: today },
    { id: uid(), name: "IV Cannula", category: "Consumable", quantity: 30, unit: "pcs", reorderLevel: 50, updatedAt: today },
    { id: uid(), name: "Pulse Oximeter", category: "Equipment", quantity: 4, unit: "units", reorderLevel: 2, updatedAt: today },
    { id: uid(), name: "Syringes 5ml", category: "Consumable", quantity: 800, unit: "pcs", reorderLevel: 300, updatedAt: today },
  ];

  const doctors: DoctorProfile[] = [
    { id: uid(), name: "Dr. Anjali Verma", role: "Senior Gynecologist", qualification: "MBBS, MD (OBG)", experience: "18+ years experience", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80", accent: "gyn" },
    { id: uid(), name: "Dr. Meera Singh", role: "Consultant Gynecologist", qualification: "MBBS, MS", experience: "10+ years experience", img: "https://images.unsplash.com/photo-1594824436998-dded4e6b23a9?w=400&q=80", accent: "gyn" },
    { id: uid(), name: "Dr. Rajeev Kumar", role: "Senior Pediatrician", qualification: "MBBS, MD (Pediatrics)", experience: "15+ years experience", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80", accent: "peds" },
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
  ];"""
content = re.sub(r'  const inventory: InventoryItem\[\] = \[[\s\S]*?\];', seed_str, content)

# 5. Return in seed
return_str = """  return {
    patients, appointments, beds, staff, expenses, bills, inventory, doctors, testimonials, blogPosts, stats,"""
content = re.sub(r'  return \{\n    patients, appointments, beds, staff, expenses, bills, inventory,', return_str, content)

# 6. Add to context impl
impl_str = """    updateInfo: (i) => update((s) => ({ ...s, info: { ...s.info, ...i } })),
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
  };"""
content = re.sub(r'    updateInfo: \(i\) => update\(\(s\) => \(\{ \.\.\.s, info: \{ \.\.\.s\.info, \.\.\.i \} \}\)\),\n    toggleModule: \(key\) => update\(\(s\) => \(\{ \.\.\.s, modules: \{ \.\.\.s\.modules, \[key\]: !s\.modules\[key\] \} \}\)\),\n    resetData: \(\) => setState\(seed\(\)\),\n  \};', impl_str, content)

with open('src/admin/context/HospitalContext.tsx', 'w') as f:
    f.write(content)
