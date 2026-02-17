import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut, Save, Loader2, Crown } from "lucide-react";

interface ProfileHeaderProps {
  displayName: string;
  email: string;
  avatarUrl: string;
  userPlan: string;
  isSaving: boolean;
  onSave: () => void;
  onSignOut: () => void;
}

export const ProfileHeader = ({
  displayName, email, avatarUrl, userPlan, isSaving, onSave, onSignOut
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const planColors: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/15 text-primary border-primary/30",
    elite: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    enterprise: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  };

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {displayName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{displayName || "Profile Settings"}</h1>
                <Badge variant="outline" className={`text-[10px] capitalize ${planColors[userPlan] || planColors.free}`}>
                  {userPlan !== "free" && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                  {userPlan}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
          <Button onClick={onSave} disabled={isSaving} size="sm" className="btn-glow">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      </div>
    </header>
  );
};
