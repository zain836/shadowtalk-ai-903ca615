import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Calendar, Clock, Sparkles, Code, Shield, Zap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const BlogPage = () => {
  const featuredPost = {
    title: "The Future of AI: Building Sovereign Intelligence",
    excerpt: "Exploring how offline AI capabilities are reshaping the landscape of artificial intelligence and empowering users with true data sovereignty.",
    author: "Zain Ahmed",
    date: "January 18, 2026",
    readTime: "8 min read",
    category: "AI & Technology",
  };

  const blogPosts = [
    { title: "Introducing Offline Mode: AI Without Internet", excerpt: "Learn how ShadowTalk AI's offline capabilities let you run powerful LLMs directly in your browser.", author: "Zain Ahmed", date: "January 15, 2026", readTime: "5 min read", category: "Product Updates", icon: Zap },
    { title: "Best Practices for Prompt Engineering", excerpt: "Master the art of crafting effective prompts to get the best results from AI assistants.", author: "ShadowTalk Team", date: "January 12, 2026", readTime: "7 min read", category: "Tutorials", icon: Code },
    { title: "Enterprise Security: How We Protect Your Data", excerpt: "A deep dive into our security infrastructure, encryption standards, and compliance certifications.", author: "ShadowTalk Team", date: "January 8, 2026", readTime: "6 min read", category: "Security", icon: Shield },
    { title: "Multi-Model AI: Choosing the Right Brain for Your Task", excerpt: "Understanding the strengths of different AI models and when to use each one.", author: "Zain Ahmed", date: "January 5, 2026", readTime: "9 min read", category: "AI & Technology", icon: Sparkles },
    { title: "Building a Tech-Independent Pakistan", excerpt: "Our vision for democratizing AI access and building sovereign technology solutions.", author: "Zain Ahmed", date: "January 1, 2026", readTime: "10 min read", category: "Vision", icon: Sparkles },
    { title: "ShadowTalk API: Getting Started Guide", excerpt: "Step-by-step tutorial for integrating ShadowTalk AI into your applications.", author: "ShadowTalk Team", date: "December 28, 2025", readTime: "12 min read", category: "Tutorials", icon: Code },
  ];

  const categories = ["All", "Product Updates", "Tutorials", "AI & Technology", "Security", "Vision"];

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
              <Badge key={i} variant={i === 0 ? "default" : "outline"} className={`cursor-pointer transition-all ${i === 0 ? 'btn-glow' : 'hover:bg-primary/10 hover:border-primary/30'}`}>
                {category}
              </Badge>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="card-glass overflow-hidden group cursor-pointer">
              <div className="grid md:grid-cols-2">
                <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-dense opacity-20" />
                  <Sparkles className="h-24 w-24 text-primary/30 relative z-10" />
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
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{featuredPost.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featuredPost.readTime}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-2xl font-bold mb-8 tracking-tight">
            Latest Articles
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blogPosts.map((post, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400 } }}
              >
                <Card className="card-glass h-full group cursor-pointer overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <post.icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant="outline" className="border-border/50 text-xs">{post.category}</Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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