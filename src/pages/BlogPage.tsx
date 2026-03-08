import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Sparkles, Code, Shield, Zap, Loader2 } from "lucide-react";
import { useBlogPosts } from "@/hooks/useCMSContent";
import { format } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const ICON_MAP: Record<string, any> = {
  "Product Updates": Zap,
  "Tutorials": Code,
  "Security": Shield,
  "AI & Technology": Sparkles,
  "Vision": Sparkles,
};

// Fallback posts when DB is empty
const FALLBACK_POSTS = [
  { id: "1", title: "The Future of AI: Building Sovereign Intelligence", excerpt: "Exploring how offline AI capabilities are reshaping the landscape of artificial intelligence.", author: "Zain Ahmed", published_at: "2026-01-18", read_time_minutes: 8, category: "AI & Technology", is_featured: true },
  { id: "2", title: "Introducing Offline Mode: AI Without Internet", excerpt: "Learn how ShadowTalk AI's offline capabilities let you run powerful LLMs directly in your browser.", author: "Zain Ahmed", published_at: "2026-01-15", read_time_minutes: 5, category: "Product Updates" },
  { id: "3", title: "Best Practices for Prompt Engineering", excerpt: "Master the art of crafting effective prompts to get the best results from AI assistants.", author: "ShadowTalk Team", published_at: "2026-01-12", read_time_minutes: 7, category: "Tutorials" },
  { id: "4", title: "Enterprise Security: How We Protect Your Data", excerpt: "A deep dive into our security infrastructure, encryption standards, and compliance certifications.", author: "ShadowTalk Team", published_at: "2026-01-08", read_time_minutes: 6, category: "Security" },
  { id: "5", title: "Multi-Model AI: Choosing the Right Brain for Your Task", excerpt: "Understanding the strengths of different AI models and when to use each one.", author: "Zain Ahmed", published_at: "2026-01-05", read_time_minutes: 9, category: "AI & Technology" },
  { id: "6", title: "Building a Tech-Independent Pakistan", excerpt: "Our vision for democratizing AI access and building sovereign technology solutions.", author: "Zain Ahmed", published_at: "2026-01-01", read_time_minutes: 10, category: "Vision" },
];

const BlogPage = () => {
  const { posts: dbPosts, isLoading } = useBlogPosts();
  const [activeCategory, setActiveCategory] = useState("All");

  const posts = dbPosts.length > 0 ? dbPosts : FALLBACK_POSTS;
  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  const categories = ["All", ...Array.from(new Set(posts.map(p => p.category)))];
  const filteredPosts = activeCategory === "All" ? gridPosts : gridPosts.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[180px]" />
      </div>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <BookOpen className="h-3 w-3 mr-1" /> Blog
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Insights & <span className="gradient-text">Updates</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest in AI technology, product updates, and tutorials
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category, i) => (
              <Badge 
                key={i} 
                variant={category === activeCategory ? "default" : "outline"} 
                className={`cursor-pointer transition-all ${category === activeCategory ? 'btn-glow' : 'hover:bg-primary/10 hover:border-primary/30'}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </motion.div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Featured */}
          {featuredPost && (
            <section className="py-8 px-4">
              <div className="container mx-auto max-w-6xl">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Card className="card-glass overflow-hidden group cursor-pointer">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-dense opacity-20" />
                        {featuredPost.cover_image_url ? (
                          <img src={featuredPost.cover_image_url} alt={featuredPost.title} className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="h-24 w-24 text-primary/30 relative z-10" />
                        )}
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center relative z-10">
                        <Badge className="w-fit mb-4 bg-primary/10 text-primary border-primary/20">{featuredPost.category}</Badge>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors tracking-tight">
                          {featuredPost.title}
                        </h2>
                        <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{featuredPost.author}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {featuredPost.published_at ? format(new Date(featuredPost.published_at), 'MMMM d, yyyy') : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />{featuredPost.read_time_minutes} min read
                          </span>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </section>
          )}

          {/* Grid */}
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-6xl">
              <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl font-bold mb-8 tracking-tight">
                Latest Articles
              </motion.h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPosts.map((post, i) => {
                  const Icon = ICON_MAP[post.category] || Sparkles;
                  return (
                    <motion.div key={post.id || i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                      whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
                    >
                      <Card className="card-glass h-full group cursor-pointer overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-6 relative z-10">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <Badge variant="outline" className="border-border/50 text-xs">{post.category}</Badge>
                          </div>
                          <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{post.author}</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time_minutes} min read</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Newsletter */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            className="glass-subtle rounded-2xl p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <h2 className="text-2xl font-bold mb-4 tracking-tight">Subscribe to our newsletter</h2>
            <p className="text-muted-foreground mb-6">Get the latest articles, tutorials, and updates delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 bg-background/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl btn-glow font-medium">Subscribe</button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
