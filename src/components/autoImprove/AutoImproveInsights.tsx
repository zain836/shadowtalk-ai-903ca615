import { Sparkles, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAutoImproveContext } from "@/contexts/AutoImproveContext";

export const AutoImproveInsights = () => {
  const { profile, runAnalysis, clearLearning, isLoading } = useAutoImproveContext();

  if (isLoading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Adaptive learning
        </CardTitle>
        <CardDescription>
          ShadowTalk learns from how you chat and quietly tunes defaults. Data stays on your device unless analytics
          consent is enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Learning confidence</span>
            <span className="font-mono">{Math.round(profile.confidence * 100)}%</span>
          </div>
          <Progress value={profile.confidence * 100} className="h-1.5" />
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.preferredMode && (
            <Badge variant="secondary">Mode: {profile.preferredMode}</Badge>
          )}
          {profile.preferredPersonality && (
            <Badge variant="secondary">Tone: {profile.preferredPersonality}</Badge>
          )}
          {profile.preferSeeRouting && <Badge variant="outline">S.E.E. boost</Badge>}
          {profile.topCategories.slice(0, 2).map((c) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </div>

        {profile.recentImprovements.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
            {profile.recentImprovements.slice(-4).map((imp) => (
              <li key={imp.id}>
                <span className="text-foreground">{imp.label}</span> — {imp.reason}
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => runAnalysis()}>
            <RefreshCw className="h-3 w-3" />
            Re-analyze
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => clearLearning()}>
            <Trash2 className="h-3 w-3" />
            Reset learning
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
