import { Bot, Github, Twitter, Linkedin, Mail, Globe, Shield, FileText, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import NewsletterSubscription from "./NewsletterSubscription";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/#features" },
        { name: "Pricing", href: "/pricing" },
        { name: "Chatbot", href: "/chatbot" },
        { name: "Marketplace", href: "/marketplace" },
        { name: "API Docs", href: "/api" },
        { name: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Tools",
      links: [
        { name: "Mission Control", href: "/missioncontrol" },
        { name: "Presentations", href: "/presentations" },
        { name: "Privacy Score", href: "/privacy-score" },
        { name: "Developers", href: "/developers" },
        { name: "Billing", href: "/billing" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "FAQ", href: "/faq" },
        { name: "Contact", href: "/contact" },
        { name: "Status", href: "/status" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Founder Access", href: "/founder-access" },
        { name: "Lifetime Deal", href: "/lifetime-deal" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" },
      ],
    },
  ];

  const socials = [
    { icon: Twitter, href: "https://twitter.com/shadowtalkai", label: "Twitter" },
    { icon: Github, href: "https://github.com/shadowtalkai", label: "GitHub" },
    { icon: Linkedin, href: "https://linkedin.com/company/shadowtalkai", label: "LinkedIn" },
    { icon: Mail, href: "mailto:shadowtalk68@gmail.com", label: "Email" },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/50">
      {/* Ambient gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/3 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center space-x-2.5 mb-6"
            >
              <div className="relative">
                <Bot className="h-7 w-7 text-primary" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full pulse-dot" />
              </div>
              <span className="text-lg font-bold gradient-text">ShadowTalk AI</span>
            </motion.div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs">
              AI-powered productivity with privacy-focused features. Optional offline mode for creators, coders & CEOs.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.map((s, i) => (
                <motion.a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg glass-subtle flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <h3 className="font-semibold text-sm mb-4 text-foreground">{section.title}</h3>
              <ul className="space-y-2.5">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mb-10">
          <NewsletterSubscription />
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 ShadowTalk AI. All rights reserved.</span>
            <div className="hidden md:flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-success" />
                SOC 2
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Global CDN
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                GDPR
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-success rounded-full pulse-dot" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
