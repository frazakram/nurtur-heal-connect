import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const posts = [
  {
    title: "10 Maternal Health Tips for a Healthy Pregnancy",
    date: "April 18, 2026",
    excerpt: "From nutrition to exercise, our gynecologists share practical, evidence-based tips to support a healthy pregnancy journey.",
    img: "https://placehold.co/600x360/FCE7F3/9D174D?text=Maternal+Health",
    accent: "gyn",
  },
  {
    title: "Child Nutrition: What Every Parent Should Know",
    date: "April 5, 2026",
    excerpt: "Balanced meals, healthy habits, and milestones — a pediatrician's guide to feeding kids from infancy through age 12.",
    img: "https://placehold.co/600x360/FEF9C3/854D0E?text=Child+Nutrition",
    accent: "peds",
  },
  {
    title: "The Complete Vaccination Schedule for Children",
    date: "March 22, 2026",
    excerpt: "An easy-to-follow IAP-recommended vaccination schedule and why staying on track matters for your child's immunity.",
    img: "https://placehold.co/600x360/E0F2FE/0369A1?text=Vaccinations",
    accent: "primary",
  },
];

const Blog = () => (
  <>
    <SEO title="Health Blog | Care Hospital" description="Tips and guidance on maternal health, child nutrition, vaccinations and more from Care Hospital specialists." />

    <section className="gradient-hero">
      <div className="container py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Health Blog</h1>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Insights and guidance from our doctors.</p>
      </div>
    </section>

    <section className="container py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <motion.article key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="rounded-3xl overflow-hidden bg-background border border-border shadow-card hover:-translate-y-1 transition-transform">
            <img src={p.img} alt={p.title} className="w-full h-48 object-cover" />
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {p.date}</div>
              <h3 className="mt-3 font-display text-lg font-bold text-primary-deep leading-snug">{p.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
              <Button variant="ghost" className="mt-4 px-0 text-primary-deep hover:bg-transparent hover:text-primary">
                Read More <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  </>
);

export default Blog;