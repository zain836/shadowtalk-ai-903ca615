import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDesktopApp } from "@/hooks/useDesktopApp";

/** Shown in chat header when running as desktop software */
export const DesktopAppBadge = () => {
  const { isDesktop, info } = useDesktopApp();
  if (!isDesktop) return null;

  return (
    <Badge
      variant="outline"
      className="hidden sm:flex gap-1 border-primary/40 text-primary text-[10px] font-medium"
    >
      <Monitor className="h-3 w-3" />
      Desktop{info?.appVersion ? ` · v${info.appVersion}` : ""}
    </Badge>
  );
};
