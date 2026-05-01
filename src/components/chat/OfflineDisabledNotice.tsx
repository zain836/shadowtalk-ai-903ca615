import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";

/**
 * Temporary placeholder shown wherever the old offline mode UI used to live.
 *
 * The previous offline / on-device AI implementation has been disabled while a
 * new version is being built. Underlying hooks, components, and pages remain on
 * disk (intentionally, so the rewrite can reuse the parts that still apply) but
 * are not mounted in the UI right now.
 */
export const OfflineDisabledNotice = ({
  title = "Offline mode is being rebuilt",
  description = "The on-device AI experience is temporarily unavailable while we ship a new, more reliable version. Cloud features continue to work normally.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border/60 bg-muted/30 text-xs text-muted-foreground">
        <Wrench className="h-3.5 w-3.5 shrink-0" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Wrench className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      </CardContent>
    </Card>
  );
};

export default OfflineDisabledNotice;
