import { useEffect, useState } from "react";
import { X, Megaphone, AlertTriangle, Info, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
}

const DISMISS_KEY = "shadowtalk-dismissed-announcements";

const typeStyles: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "bg-primary/10 border-primary/30 text-foreground" },
  warning: { icon: AlertTriangle, className: "bg-amber-500/10 border-amber-500/30 text-foreground" },
  success: { icon: Sparkles, className: "bg-emerald-500/10 border-emerald-500/30 text-foreground" },
  alert: { icon: AlertTriangle, className: "bg-destructive/10 border-destructive/30 text-foreground" },
};

function getDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const next = [...new Set([...getDismissed(), id])];
  localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
}

/**
 * Shows active rows from `announcements` (admin CMS) site-wide.
 */
export const AnnouncementBanner = () => {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("announcements")
        .select("id, title, message, type")
        .eq("is_active", true)
        .lte("starts_at", now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("starts_at", { ascending: false })
        .limit(3);

      if (data) {
        const dismissed = getDismissed();
        setItems(data.filter((a) => !dismissed.includes(a.id)));
      }
    };

    load();

    const channel = supabase
      .channel("announcements-banner")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (items.length === 0) return null;

  const current = items[0];
  const style = typeStyles[current.type] ?? typeStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative z-[60] border-b px-4 py-2.5",
        style.className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="container mx-auto flex items-start gap-3 max-w-6xl">
        <Megaphone className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {current.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{current.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          aria-label="Dismiss announcement"
          onClick={() => {
            dismiss(current.id);
            setItems((prev) => prev.filter((a) => a.id !== current.id));
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
