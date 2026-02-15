import React, { useState } from "react";
import { Menu, X, Bot, Shield, BookOpen, Users, History, User, Code, BarChart3, Building2, Settings, UserCircle, Brain, Sparkles, ChevronDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FeedbackForm } from "@/components/FeedbackForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/components/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const primaryNavItems = [
    { name: t("nav.pricing"), href: "/pricing", icon: Shield, isLink: true },
    { name: "Strategy Agent", href: "/strategy", icon: Brain, isLink: true },
    { name: "AI Workspace", href: "/workspace", icon: Sparkles, isLink: true },
  ];

  const secondaryNavItems = [
    { name: t("nav.docs"), href: "/docs", icon: BookOpen, isLink: true },
    { name: t("nav.changelog"), href: "/changelog", icon: History, isLink: true },
    { name: t("nav.rooms"), href: "/rooms", icon: Users, isLink: true },
    { name: t("nav.api"), href: "/api", icon: Code, isLink: true },
    { name: t("nav.analytics"), href: "/analytics", icon: BarChart3, isLink: true },
    { name: "Enterprise", href: "/enterprise", icon: Building2, isLink: true },
    { name: "About", href: "/about", icon: UserCircle, isLink: true },
    { name: "Admin", href: "/admin", icon: Settings, isLink: true },
    { name: t("nav.profile"), href: "/profile", icon: User, isLink: true },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleNavClick = (item: typeof primaryNavItems[0]) => {
    if (item.isLink) {
      navigate(item.href);
    } else {
      document.getElementById(item.href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0 group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <Bot className="h-7 w-7 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full pulse-dot"></div>
              </div>
              <span className="text-lg font-semibold tracking-tight gradient-text hidden sm:inline whitespace-nowrap">
                ShadowTalk AI
              </span>
            </div>
            {user && <WorkspaceSwitcher />}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {primaryNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item)}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1.5 px-3.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200 text-sm font-medium">
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass-strong border-border/50">
                {secondaryNavItems.map((item, index) => (
                  <React.Fragment key={item.name}>
                    {index === 6 && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => handleNavClick(item)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <NotificationBell />
            <LanguageSwitcher />
            <FeedbackForm />
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all duration-200"
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
            className="lg:hidden p-2 text-foreground hover:bg-muted/40 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 glass-strong border-b border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {user && (
                <div className="pb-3 mb-3 border-b border-border/50">
                  <WorkspaceSwitcher />
                </div>
              )}
              {allNavItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    handleNavClick(item);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all w-full text-left px-3 py-2.5 rounded-lg"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              ))}
              <div className="flex flex-col space-y-2 pt-3 mt-3 border-t border-border/50">
                <div className="flex items-center gap-2 px-3">
                  <LanguageSwitcher />
                  <FeedbackForm />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-3"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  {t("nav.login")}
                </Button>
                <Button
                  size="sm"
                  className="btn-glow mx-3"
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