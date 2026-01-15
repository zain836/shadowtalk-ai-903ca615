import React, { useState } from "react";
import { Menu, X, Bot, Zap, Shield, BookOpen, Users, History, User, Code, BarChart3, Building2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FeedbackForm } from "@/components/FeedbackForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/components/AuthProvider";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const navItems = [
    { name: t("nav.features"), href: "#features", icon: Zap, isLink: false },
    { name: t("nav.pricing"), href: "/pricing", icon: Shield, isLink: true },
    { name: t("nav.docs"), href: "/docs", icon: BookOpen, isLink: true },
    { name: t("nav.changelog"), href: "/changelog", icon: History, isLink: true },
    { name: t("nav.rooms"), href: "/rooms", icon: Users, isLink: true },
    { name: t("nav.api"), href: "/api", icon: Code, isLink: true },
    { name: t("nav.analytics"), href: "/analytics", icon: BarChart3, isLink: true },
    { name: t("nav.enterprise") || "Enterprise", href: "/enterprise", icon: Building2, isLink: true },
    { name: "Admin", href: "/admin", icon: Settings, isLink: true },
    { name: t("nav.profile"), href: "/profile", icon: User, isLink: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isLink) {
      navigate(item.href);
    } else {
      document.getElementById(item.href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <Bot className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full pulse-dot"></div>
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:inline">ShadowTalk AI</span>
            </div>
            {user && <WorkspaceSwitcher />}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <LanguageSwitcher />
            <FeedbackForm />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              {t("nav.login")}
            </Button>
            <Button
              size="sm"
              className="btn-glow"
              onClick={() => navigate('/chatbot')}
            >
              {t("nav.tryFree")}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-background border-b border-border">
            <div className="px-4 py-6 space-y-6">
              {user && (
                <div className="pb-4 border-b border-border">
                  <WorkspaceSwitcher />
                </div>
              )}
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    handleNavClick(item);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors w-full text-left"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <FeedbackForm />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  {t("nav.login")}
                </Button>
                <Button
                  size="sm"
                  className="btn-glow"
                  onClick={() => {
                    navigate('/chatbot');
                    setIsMenuOpen(false);
                  }}
                >
                  {t("nav.tryFree")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
