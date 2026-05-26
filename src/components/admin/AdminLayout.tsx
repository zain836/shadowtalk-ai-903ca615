import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminNavGroups, findAdminNavItem, type AdminNavItem } from "./adminNav";
import type { LucideIcon } from "lucide-react";

type AdminLayoutProps = {
  activeSection: string;
  onSectionChange: (id: string) => void;
  adminEmail?: string | null;
  pendingFeedback?: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  children: ReactNode;
};

function NavButton({
  item,
  isActive,
  collapsed,
  badge,
  onClick,
}: {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : item.description ?? item.label}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1 text-[10px]">
          {badge > 9 ? "9+" : badge}
        </Badge>
      )}
    </button>
  );
}

function SidebarNav({
  activeSection,
  onSectionChange,
  collapsed,
  pendingFeedback,
  onNavigateItem,
}: {
  activeSection: string;
  onSectionChange: (id: string) => void;
  collapsed: boolean;
  pendingFeedback: number;
  onNavigateItem?: () => void;
}) {
  const pick = (item: AdminNavItem) => {
    onSectionChange(item.id);
    onNavigateItem?.();
  };

  return (
    <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
      {adminNavGroups.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
              {group.title}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={activeSection === item.id}
                collapsed={collapsed}
                badge={item.badgeKey === "pendingFeedback" ? pendingFeedback : undefined}
                onClick={() => pick(item)}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminLayout({
  activeSection,
  onSectionChange,
  adminEmail,
  pendingFeedback = 0,
  sidebarCollapsed,
  onToggleSidebar,
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const current = findAdminNavItem(activeSection);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen sticky top-0 border-r border-border bg-sidebar flex-col transition-all duration-300 z-40",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b border-border shrink-0">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-sm block truncate">ShadowTalk Admin</span>
                <span className="text-[10px] text-muted-foreground">Control panel</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onToggleSidebar}>
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <SidebarNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={sidebarCollapsed}
          pendingFeedback={pendingFeedback}
        />

        <div className="p-2 border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => navigate("/chatbot")}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
              sidebarCollapsed ? "justify-center px-0 py-2.5" : "px-2.5 py-2",
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Back to app</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9 shrink-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Admin</span>
                </div>
                <SidebarNav
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  collapsed={false}
                  pendingFeedback={pendingFeedback}
                  onNavigateItem={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{current?.label ?? "Dashboard"}</h1>
              {current?.description && (
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{current.description}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs shrink-0 max-w-[180px] truncate">
            {adminEmail}
          </Badge>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
