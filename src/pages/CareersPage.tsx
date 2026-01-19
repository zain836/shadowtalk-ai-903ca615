import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Users,
  Zap,
  Heart,
  Globe,
  Rocket,
  Code,
  Palette,
  Megaphone,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

const CareersPage = () => {
  const benefits = [
    { icon: Zap, title: "Cutting-Edge Tech", description: "Work with the latest AI and ML technologies" },
    { icon: Globe, title: "Remote-First", description: "Work from anywhere in the world" },
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive health coverage" },
    { icon: Rocket, title: "Growth", description: "Learning budget and career development" },
    { icon: Users, title: "Great Team", description: "Collaborate with talented individuals" },
    { icon: Clock, title: "Flexible Hours", description: "Work when you're most productive" }
  ];

  const openPositions = [
    {
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      icon: Code,
      description: "Build and optimize our AI infrastructure and model integrations."
    },
    {
      title: "Full Stack Developer",
      department: "Engineering",
      location: "Remote / Karachi",
      type: "Full-time",
      icon: Code,
      description: "Develop features across our React frontend and backend services."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      icon: Palette,
      description: "Design beautiful, intuitive interfaces for our AI platform."
    },
    {
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      icon: Code,
      description: "Manage our cloud infrastructure and deployment pipelines."
    },
    {
      title: "Growth Marketer",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      icon: Megaphone,
      description: "Drive user acquisition and growth strategies."
    },
    {
      title: "Technical Writer",
      department: "Product",
      location: "Remote",
      type: "Part-time",
      icon: Code,
      description: "Create documentation, tutorials, and API guides."
    }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We push boundaries and embrace new ideas. If it hasn't been done, we'll figure it out."
    },
    {
      title: "User Obsession",
      description: "Every decision starts with how it benefits our users. Their success is our success."
    },
    {
      title: "Sovereignty",
      description: "We believe in building technology that empowers users with control over their data."
    },
    {
      title: "Impact > Effort",
      description: "We focus on outcomes, not hours. Smart work beats hard work."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <Briefcase className="h-3 w-3 mr-1" />
            Careers
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Build the Future of <span className="gradient-text">AI</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join us in democratizing artificial intelligence and building sovereign technology solutions for everyone.
          </p>
          <Button size="lg" asChild>
            <a href="#positions">
              View Open Positions
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground">What drives us every day</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join Us?</h2>
            <p className="text-muted-foreground">Perks and benefits of working at ShadowTalk AI</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground">Find your next opportunity</p>
          </div>
          <div className="space-y-4">
            {openPositions.map((position, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                        <position.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {position.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{position.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {position.department}
                          </Badge>
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            {position.location}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {position.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="shrink-0">
                      Apply Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Don't see a perfect fit?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Send General Application</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
