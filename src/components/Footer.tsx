import { Bot, Github, Twitter, Linkedin, Mail, Globe, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import NewsletterSubscription from "./NewsletterSubscription";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/#features" },
        { name: "Pricing", href: "/pricing" },
        { name: "API Docs", href: "/api" },
        { name: "Changelog", href: "/changelog" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "FAQ", href: "/faq" },
        { name: "Contact", href: "/contact" },
        { name: "Status", href: "/status" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" }
      ]
    }
  ];

  return (
    <footer className="bg-card/50 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-8 rounded-2xl mb-12 border border-border/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold mb-2">Stay in the Loop</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Get the latest updates, AI insights, and exclusive features delivered to your inbox.
              </p>
            </div>
            <NewsletterSubscription />
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <Bot className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full pulse-dot"></div>
              </div>
              <span className="text-xl font-bold gradient-text">ShadowTalk AI</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed max-w-xs">
              The most advanced AI assistant for developers, creators, and teams.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a href="https://twitter.com/shadowtalkai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com/shadowtalkai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/shadowtalkai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="mailto:support@shadowtalkai.com" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4 text-foreground text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
            <span>© 2024 ShadowTalk AI. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-green-500" />
                <span>SOC 2</span>
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-primary" />
                <span>Global CDN</span>
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3 text-accent" />
                <span>GDPR</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
