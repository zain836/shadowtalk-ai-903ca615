import { Star, Quote, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

const cardVariants = {
  hidden: { opacity: 0, y: 60, rotateX: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const TestimonialsSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const testimonials = [
    {
      name: "Emily Carter",
      role: "Software Developer",
      company: "NovaTech",
      avatar: avatar1,
      rating: 5,
      content: "This chatbot has completely transformed my workflow! The code generation feature saved me 20+ hours a week. The AI understands context better than any tool I've used before.",
      highlight: "20+ hours saved weekly",
      metric: "+340%",
      metricLabel: "Productivity",
    },
    {
      name: "James Mitchell",
      role: "Product Manager",
      company: "Launchpad.io",
      avatar: avatar2,
      rating: 5,
      content: "Incredible AI assistant! I use it for everything from writing documentation to automating repetitive tasks. The offline mode is a game-changer for remote work.",
      highlight: "Offline mode game-changer",
      metric: "100%",
      metricLabel: "Uptime",
    },
    {
      name: "Daniel Park",
      role: "Full Stack Developer",
      company: "CodeForge",
      avatar: avatar3,
      rating: 5,
      content: "The script automation feature is phenomenal. I can generate complex automation scripts in minutes instead of hours. Best investment I've made for my productivity.",
      highlight: "Minutes instead of hours",
      metric: "10x",
      metricLabel: "Faster",
    },
  ];

  return (
    <section ref={sectionRef} className="py-28 bg-background relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 bg-grid-dense opacity-30" />
      <motion.div
        animate={isInView ? { scale: [1, 1.3, 1], opacity: [0.04, 0.08, 0.04] } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/3 w-[700px] h-[400px] bg-secondary/5 rounded-full blur-[150px]"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center space-x-2 glass-subtle rounded-full px-5 py-2 mb-8"
          >
            <Quote className="h-4 w-4 text-secondary" />
            <span className="text-sm text-muted-foreground font-medium">User Stories</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
          >
            Loved by{" "}
            <span className="gradient-text">Thousands</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Real stories from developers, founders, and teams who transformed their workflow.
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto" style={{ perspective: "1200px" }}>
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{
                y: -12,
                scale: 1.03,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)] group relative overflow-hidden">
                {/* Top glow line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardContent className="p-8">
                  {/* Metric badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.15, type: "spring" }}
                    className="inline-flex items-center gap-2 glass-subtle rounded-full px-3 py-1.5 mb-5"
                  >
                    <span className="text-lg font-bold gradient-text">{testimonial.metric}</span>
                    <span className="text-xs text-muted-foreground">{testimonial.metricLabel}</span>
                  </motion.div>

                  {/* Stars */}
                  <div className="flex items-center space-x-1 mb-5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.06, type: "spring", stiffness: 500 }}
                      >
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-muted-foreground mb-6 leading-relaxed text-sm">
                    "{testimonial.content}"
                  </blockquote>

                  {/* Highlight */}
                  <div className="mb-6 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs font-medium text-primary flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3" />
                      {testimonial.highlight}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-4">
                    <motion.img
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
                    />
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role} · {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass-subtle rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex text-warning text-sm">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <span className="text-lg font-bold">4.9/5</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <span className="text-sm text-muted-foreground">
              from <span className="text-foreground font-semibold">12,483</span> verified reviews
            </span>
            <div className="hidden sm:block w-px h-6 bg-border" />
            <span className="text-sm text-muted-foreground">
              Trusted worldwide
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
