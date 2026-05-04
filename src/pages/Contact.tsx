import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SEO } from "@/components/SEO";
import { useHospital } from "../admin/context/HospitalContext";
import { supabase } from "../lib/supabase";

const hours = [
  { day: "Monday – Saturday", time: "8:00 AM – 8:00 PM" },
  { day: "Sunday", time: "10:00 AM – 2:00 PM" },
  { day: "Emergency", time: "24 / 7" },
];

const Contact = () => {
  const { info } = useHospital();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in name, phone and message");
      return;
    }
    const { error } = await supabase.from('messages').insert([{ name: form.name, phone: form.phone, email: form.email, message: form.message }]);
    if (error) {
      toast.error("Failed to send message: " + error.message);
      return;
    }
    
    toast.success("Thank you! We'll be in touch shortly.");
    setForm({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <>
      <SEO title="Contact Care Hospital | Sasaram, Bihar" description="Visit, call, or email Care Hospital in Sasaram, Bihar. Address, hours, and contact form." />

      <section className="gradient-hero">
        <div className="container py-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Get in Touch</h1>
          <p className="mt-4 max-w-2xl mx-auto text-foreground/70">We're here to help — reach out anytime.</p>
        </div>
      </section>

      <section className="container py-16 grid gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
          <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <div className="flex gap-3"><MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <div className="font-semibold text-primary-deep">Address</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <a href="https://maps.app.goo.gl/bAiEYqUnBcZDYsok9" target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                    {info.address}
                  </a>
                </p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
              <Phone className="h-5 w-5 text-primary" />
              <div className="font-semibold text-primary-deep mt-2">Phone</div>
              <p className="text-sm text-muted-foreground">{info.phone}</p>
            </div>
            <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
              <Mail className="h-5 w-5 text-primary" />
              <div className="font-semibold text-primary-deep mt-2">Email</div>
              <p className="text-sm text-muted-foreground">{info.email}</p>
            </div>
          </div>
          
          <Button asChild variant="outline" className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
            <a href={`https://wa.me/${info.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Message on WhatsApp
            </a>
          </Button>

          <div className="rounded-2xl bg-background border border-border p-6 shadow-card">
            <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />
              <div className="font-semibold text-primary-deep">Working Hours</div>
            </div>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {hours.map((h) => (
                  <tr key={h.day} className="border-t border-border">
                    <td className="py-2.5 text-foreground/80">{h.day}</td>
                    <td className="py-2.5 text-right font-medium text-primary-deep">{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.form initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          onSubmit={onSubmit} className="rounded-2xl bg-background border border-border p-8 shadow-card space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary-deep">Send us a Message</h2>
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-msg">Message</Label>
            <Textarea id="c-msg" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" size="lg" className="w-full">Submit</Button>
        </motion.form>
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl overflow-hidden shadow-card border border-border">
          <iframe
            title="Care Hospital location"
            src="https://www.google.com/maps?q=Daira,+Near+Fruit+Market,+Sasaram,+Rohtas,+Bihar+821115&output=embed"
            width="100%"
            height="420"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
};

export default Contact;