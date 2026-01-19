import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MessageSquare, 
  Zap, 
  Shield, 
  CreditCard, 
  Settings, 
  Users, 
  Code,
  BookOpen,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const HelpCenterPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: MessageSquare,
      title: "Getting Started",
      description: "Learn the basics of ShadowTalk AI",
      articles: 12,
      href: "/docs"
    },
    {
      icon: Zap,
      title: "Features & Capabilities",
      description: "Explore all AI features and modes",
      articles: 24,
      href: "/docs"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Data protection and security measures",
      articles: 8,
      href: "/privacy"
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Plans, payments, and invoices",
      articles: 15,
      href: "/pricing"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Manage your account preferences",
      articles: 10,
      href: "/profile"
    },
    {
      icon: Users,
      title: "Team & Collaboration",
      description: "Workspaces and team features",
      articles: 9,
      href: "/rooms"
    },
    {
      icon: Code,
      title: "API & Integrations",
      description: "Developer documentation and APIs",
      articles: 18,
      href: "/api"
    },
    {
      icon: HelpCircle,
      title: "Troubleshooting",
      description: "Common issues and solutions",
      articles: 22,
      href: "/faq"
    }
  ];

  const popularArticles = [
    { title: "How to get started with ShadowTalk AI", category: "Getting Started" },
    { title: "Understanding AI personalities and modes", category: "Features" },
    { title: "Setting up offline mode for local AI", category: "Features" },
    { title: "Managing your subscription and billing", category: "Billing" },
    { title: "Integrating with external APIs", category: "API" },
    { title: "Best practices for prompt engineering", category: "Tips" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            <BookOpen className="h-3 w-3 mr-1" />
            Help Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How can we <span className="gradient-text">help you</span>?
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Search our knowledge base or browse categories to find answers
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for articles, tutorials, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-8">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link key={index} to={category.href}>
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{category.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    <Badge variant="outline">{category.articles} articles</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Popular Articles</h2>
          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{article.title}</h3>
                      <Badge variant="secondary" className="mt-1 text-xs">{article.category}</Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-0">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is here to assist you with any questions or issues.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenterPage;
