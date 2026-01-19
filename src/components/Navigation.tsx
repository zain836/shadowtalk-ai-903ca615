import { useState } from "react";
import { Menu, X, Bot, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/components/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const mainNavItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Docs", href: "/docs" },
  ];

  const moreItems = [
    { name: "API", href: "/api" },
    { name: "Analytics", href: "/analytics" },
    { name: "Chat Rooms", href: "/rooms" },
    { name: "Changelog", href: "/changelog" },
    { name: "About", href: "/about" },
    { name: "Enterprise", href: "/enterprise" },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      document.getElementById(href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(href);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <Bot className="h-7 w-7 text-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">ShadowTalk AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
              >
                {item.name}
              </button>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50">
                  More
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {moreItems.map((item) => (
                  <DropdownMenuItem
                    key={item.name}
                    onClick={() => handleNavClick(item.href)}
                    className="cursor-pointer"
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
                {user && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                      Profile
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button size="sm" onClick={() => navigate('/chatbot')}>
                Open Chat
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate('/chatbot')}>
                  Try Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground hover:bg-accent/50 rounded-md"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-md hover:bg-accent/50"
                >
                  {item.name}
                </button>
              ))}
              {moreItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-md hover:bg-accent/50"
                >
                  {item.name}
                </button>
              ))}
              {user && (
                <>
                  <div className="my-2 border-t border-border" />
                  <button
                    onClick={() => handleNavClick('/admin')}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-md hover:bg-accent/50"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => handleNavClick('/profile')}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left rounded-md hover:bg-accent/50"
                  >
                    Profile
                  </button>
                </>
              )}
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                {user ? (
                  <Button size="sm" onClick={() => handleNavClick('/chatbot')}>
                    Open Chat
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleNavClick('/auth')}>
                      Sign In
                    </Button>
                    <Button size="sm" onClick={() => handleNavClick('/chatbot')}>
                      Try Free
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
