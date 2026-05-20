import { SEO } from "@/components/SEO";
import { useHospital } from "../admin/context/HospitalContext";

const Privacy = () => {
  const { info } = useHospital();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-8">
      <h2 className="font-display text-xl font-bold text-primary-deep">{title}</h2>
      <div className="mt-2 text-foreground/75 leading-relaxed space-y-2 text-sm">{children}</div>
    </div>
  );

  return (
    <>
      <SEO title={`Privacy Policy | ${info.name}`} description={`How ${info.name} collects, uses, stores and protects your personal and health information.`} />

      <section className="gradient-hero">
        <div className="container py-16 text-center">
          <h1 className="font-display text-4xl font-bold text-primary-deep">Privacy Policy</h1>
          <p className="mt-3 text-foreground/70">How we handle your personal and health information.</p>
        </div>
      </section>

      <section className="container py-12 max-w-3xl">
        <p className="text-sm text-muted-foreground">
          This policy explains how {info.name} ("we", "the hospital") collects, uses, stores and
          protects your information when you book appointments, use the patient portal, or contact
          us. It is aligned with India's Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <Section title="Information we collect">
          <p>Identity &amp; contact: name, phone number, email address.</p>
          <p>Health &amp; appointment: department, doctor, appointment date/time, booking history,
            and any clinical notes recorded during care.</p>
          <p>We collect only what is needed to provide and follow up on your care.</p>
        </Section>

        <Section title="Why we use it">
          <p>To schedule, confirm, remind and manage your appointments; to provide medical care
            and billing; and to contact you about your visit. We do not sell your data or use it
            for advertising.</p>
        </Section>

        <Section title="Legal basis — your consent">
          <p>We process your data based on the consent you give when registering or booking.
            You may withdraw consent at any time (see "Your rights"); this will not affect care
            already provided or records we are legally required to retain.</p>
        </Section>

        <Section title="How we protect it">
          <p>Data is stored in a managed PostgreSQL database with row-level security so each
            patient can access only their own records. Connections are encrypted in transit.
            Email verification (one-time codes) is used to confirm bookings. Access to records
            is limited to authorised hospital staff.</p>
        </Section>

        <Section title="Sharing">
          <p>Your information is accessible only to treating clinicians and authorised staff of
            {" "}{info.name}. We use a hosting provider and an email provider solely to operate
            this service; they process data on our behalf and not for their own purposes. We
            disclose data otherwise only when required by law.</p>
        </Section>

        <Section title="Retention">
          <p>Medical and appointment records are retained for the period required for continuity
            of care and by applicable medical record-keeping norms, and then securely deleted or
            anonymised. Drop-off enquiry leads are kept only until actioned.</p>
        </Section>

        <Section title="Children's data (Paediatrics)">
          <p>For patients who are minors, bookings and records are made by a parent or guardian,
            whose consent covers the child's data.</p>
        </Section>

        <Section title="Your rights">
          <p>You may request access to, correction of, or deletion of your personal data, and
            withdraw consent. To exercise these rights, contact our Grievance Officer below and
            we will respond within a reasonable period.</p>
        </Section>

        <Section title="Grievance Officer / contact">
          <p>{info.name}</p>
          <p>{info.address}</p>
          <p>Phone: {info.phone}{info.email ? ` · Email: ${info.email}` : ""}</p>
        </Section>

        <Section title="Changes">
          <p>We may update this policy; material changes will be posted on this page. Please
            review it periodically.</p>
        </Section>

        <p className="mt-10 text-xs text-muted-foreground">
          This policy is provided for transparency and should be reviewed by a qualified legal
          advisor for your jurisdiction.
        </p>
      </section>
    </>
  );
};

export default Privacy;
