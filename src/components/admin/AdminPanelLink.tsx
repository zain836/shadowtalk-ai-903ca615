import { Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Shown on profile for admin users */
export function AdminPanelLink() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();

  if (loading || !isAdmin) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Admin panel</p>
            <p className="text-xs text-muted-foreground">
              Manage users, releases, broadcasts, and platform settings.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/admin")} className="shrink-0">
          Open admin
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
