import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ArrowRight,
  Sparkles,
  Code,
  Shield,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const BlogPage = () => {
  const featuredPost = {
    title: "The Future of AI: Building Sovereign Intelligence",
    excerpt: "Exploring how offline AI capabilities are reshaping the landscape of artificial intelligence and empowering users with true data sovereignty.",
    author: "Zain Ahmed",
    date: "January 18, 2026",
    readTime: "8 min read",
    category: "AI & Technology",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800"
  };

  const blogPosts = [
    {
      title: "Introducing Offline Mode: AI Without Internet",
      excerpt: "Learn how ShadowTalk AI's offline capabilities let you run powerful LLMs directly in your browser.",
      author: "Zain Ahmed",
      date: "January 15, 2026",
      readTime: "5 min read",
      category: "Product Updates",
      icon: Zap
    },
    {
      title: "Best Practices for Prompt Engineering",
      excerpt: "Master the art of crafting effective prompts to get the best results from AI assistants.",
      author: "ShadowTalk Team",
      date: "January 12, 2026",
      readTime: "7 min read",
      category: "Tutorials",
      icon: Code
    },
    {
      title: "Enterprise Security: How We Protect Your Data",
      excerpt: "A deep dive into our security infrastructure, encryption standards, and compliance certifications.",
      author: "ShadowTalk Team",
      date: "January 8, 2026",
      readTime: "6 min read",
      category: "Security",
      icon: Shield
    },
    {
      title: "Multi-Model AI: Choosing the Right Brain for Your Task",
      excerpt: "Understanding the strengths of different AI models and when to use each one.",
      author: "Zain Ahmed",
      date: "January 5, 2026",
      readTime: "9 min read",
      category: "AI & Technology",
      icon: Sparkles
    },
    {
      title: "Building a Tech-Independent Pakistan",
      excerpt: "Our vision for democratizing AI access and building sovereign technology solutions.",
      author: "Zain Ahmed",
      date: "January 1, 2026",
      readTime: "10 min read",
      category: "Vision",
      icon: Sparkles
    },
    {
      title: "ShadowTalk API: Getting Started Guide",
      excerpt: "Step-by-step tutorial for integrating ShadowTalk AI into your applications.",
      author: "ShadowTalk Team",
      date: "December 28, 2025",
      readTime: "12 min read",
      category: "Tutorials",
      icon: Code
    }
  ];

  const categories = ["All", "Product Updates", "Tutorials", "AI & Technology", "Security", "Vision"];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" />
              Blog
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Insights & <span className="gradient-text">Updates</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest in AI technology, product updates, and tutorials
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category, index) => (
              <Badge 
                key={index} 
                variant={index === 0 ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="grid md:grid-cols-2">
              <div className="aspect-video md:aspect-auto bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Sparkles className="h-24 w-24 text-primary/50" />
              </div>
              <CardContent className="p-8 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit mb-4">{featuredPost.category}</Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{featuredPost.author}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {featuredPost.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {featuredPost.readTime}
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <post.icon className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.author}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Subscribe to our newsletter</h2>
          <p className="text-muted-foreground mb-6">
            Get the latest articles, tutorials, and updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;
