import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ArrowRight, User, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

import { useHospital } from "../admin/context/HospitalContext";

const Blog = () => {
  const { blogPosts, doctors } = useHospital();
  const [filter, setFilter] = useState<"all" | "gyn" | "peds" | "primary">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredPosts = blogPosts.filter(p => p.published !== false && (filter === "all" || p.accent === filter));
  const expandedPost = blogPosts.find(p => p.id === expandedId);

  const getAuthor = (accent: string) => {
    if (accent === 'gyn') return doctors.find(d => d.department === 'Gynecology')?.name ?? "Care Hospital";
    if (accent === 'peds') return doctors.find(d => d.department === 'Pediatrics')?.name ?? "Care Hospital";
    return "Care Hospital Editorial";
  };
  const getReadTime = (content: string) => Math.max(1, Math.ceil(content.split(" ").length / 200)) + " min read";

  return (
  <>
    <SEO title="Health Blog | Care Hospital" description="Tips and guidance on maternal health, child nutrition, vaccinations and more from Care Hospital specialists." />

    <section className="gradient-hero">
      <div className="container py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-deep">Health Blog</h1>
        <p className="mt-4 max-w-2xl mx-auto text-foreground/70">Insights and guidance from our doctors.</p>
      </div>
    </section>

    <section className="container py-16">
      <AnimatePresence mode="wait">
        {expandedPost ? (
          <motion.article 
            key="expanded"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto bg-background rounded-3xl border border-border shadow-sm overflow-hidden"
          >
            <img src={expandedPost.img} alt={expandedPost.title} className="w-full h-[300px] md:h-[400px] object-cover" />
            <div className="p-8 md:p-12">
              <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground" onClick={() => setExpandedId(null)}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Articles
              </Button>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4 border-b border-border pb-4">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {expandedPost.date}</span>
                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {expandedPost.author || getAuthor(expandedPost.accent)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {getReadTime(expandedPost.content)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${expandedPost.accent === 'gyn' ? 'bg-pink-100 text-pink-700' : expandedPost.accent === 'peds' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {expandedPost.accent === 'gyn' ? 'Gynecology' : expandedPost.accent === 'peds' ? 'Pediatrics' : 'General'}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-deep leading-tight mb-6">{expandedPost.title}</h1>
              <div className="prose prose-blue max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {expandedPost.content}
              </div>
            </div>
          </motion.article>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} className="rounded-full">All Articles</Button>
              <Button variant={filter === "gyn" ? "default" : "outline"} onClick={() => setFilter("gyn")} className="rounded-full">Gynecology</Button>
              <Button variant={filter === "peds" ? "default" : "outline"} onClick={() => setFilter("peds")} className="rounded-full">Pediatrics</Button>
              <Button variant={filter === "primary" ? "default" : "outline"} onClick={() => setFilter("primary")} className="rounded-full">General Health</Button>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No articles found in this category.</div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((p, i) => (
                  <motion.article key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="rounded-3xl overflow-hidden bg-background border border-border shadow-card hover:-translate-y-1 transition-transform cursor-pointer flex flex-col"
                    onClick={() => setExpandedId(p.id)}>
                    <img src={p.img} alt={p.title} className="w-full h-48 object-cover" />
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {getReadTime(p.content)}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-primary-deep leading-snug">{p.title}</h3>
                      <p className="mt-3 text-sm text-muted-foreground flex-1 line-clamp-3">{p.excerpt}</p>
                      
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <div className="text-xs font-medium text-foreground/80 flex items-center gap-1">
                          <User className="h-3 w-3" /> {p.author || getAuthor(p.accent)}
                        </div>
                        <span className="text-primary-deep text-sm font-semibold flex items-center group-hover:text-primary transition-colors">
                          Read <ArrowRight className="ml-1 h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  </>
  );
};

export default Blog;