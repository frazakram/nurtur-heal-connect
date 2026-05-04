import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, MapPin, Phone, Mail, HeartPulse } from "lucide-react";
import { useHospital } from "../../admin/context/HospitalContext";

export const Footer = () => {
  const { info } = useHospital();
  
  return (
  <footer className="mt-20 border-t border-border bg-primary-soft/40">
    <div className="container py-14 grid gap-10 md:grid-cols-4">
      <div>
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary-deep">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </span>
          Care Hospital
        </Link>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          A specialty hospital dedicated to women's and children's health in Sasaram, Bihar.
        </p>
      </div>
      <div>
        <h4 className="font-display font-semibold text-primary-deep mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/about" className="hover:text-primary-deep">About</Link></li>
          <li><Link to="/services" className="hover:text-primary-deep">Services</Link></li>
          <li><Link to="/doctors" className="hover:text-primary-deep">Doctors</Link></li>
          <li><Link to="/blog" className="hover:text-primary-deep">Blog</Link></li>
          <li><Link to="/contact" className="hover:text-primary-deep">Contact</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold text-primary-deep mb-4">Specialties</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Gynecology & Obstetrics</li>
          <li>Pediatrics & Newborn Care</li>
          <li>NICU Support</li>
          <li>24/7 Emergency</li>
        </ul>
      </div>
      <div>
        <h4 className="font-display font-semibold text-primary-deep mb-4">Contact</h4>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" /> <a href="https://maps.app.goo.gl/bAiEYqUnBcZDYsok9" target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">{info.address}</a></li>
          <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary" /> {info.phone}</li>
          <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 text-primary" /> {info.email}</li>
        </ul>
        <div className="flex gap-3 mt-4">
          <a href="#" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-colors"><Facebook className="h-4 w-4" /></a>
          <a href="#" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full bg-background hover:bg-gyn-strong hover:text-primary-foreground transition-colors"><Instagram className="h-4 w-4" /></a>
          <a href={`https://wa.me/${info.phone.replace(/[^0-9]/g, '')}`} aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-background hover:bg-green-500 hover:text-white transition-colors"><MessageCircle className="h-4 w-4" /></a>
        </div>
      </div>
    </div>
    <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Care Hospital, Sasaram. All rights reserved.
    </div>
  </footer>
  );
};