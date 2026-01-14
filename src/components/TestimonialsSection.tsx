import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import avatar1 from "@/assets/avatar-1.jpg";
import avatar2 from "@/assets/avatar-2.jpg";
import avatar3 from "@/assets/avatar-3.jpg";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      company: "TechCorp",
      avatar: avatar1,
      rating: 5,
      content: "This chatbot has completely transformed my workflow! The code generation feature saved me 20+ hours a week. The AI understands context better than any tool I've used before."
    },
    {
      name: "Mark Rodriguez",
      role: "Product Manager",
      company: "StartupXYZ",
      avatar: avatar2,
      rating: 5,
      content: "Incredible AI assistant! I use it for everything from writing documentation to automating repetitive tasks. The offline mode is a game-changer for remote work."
    },
    {
      name: "Alex Chen",
      role: "Full Stack Developer",
      company: "DevStudio",
      avatar: avatar3,
      rating: 5,
      content: "The script automation feature is phenomenal. I can generate complex automation scripts in minutes instead of hours. Best investment I've made for my productivity."
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 border border-border rounded-full px-4 py-2 mb-6">
            <Quote className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">User Stories</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Loved by{" "}
            <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See what our users are saying about their experience with our AI assistant.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-hover">
              <CardContent className="p-8">
                {/* Stars */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-lg font-semibold">4.9/5</span>
              <span className="text-muted-foreground">from 2,500+ reviews</span>
            </div>
            <div className="text-muted-foreground">
              Trusted by developers and teams worldwide
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
