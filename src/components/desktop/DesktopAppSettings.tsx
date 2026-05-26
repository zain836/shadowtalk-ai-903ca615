import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, FolderOpen, ExternalLink } from "lucide-react";
import { useDesktopApp } from "@/hooks/useDesktopApp";
import { useNavigate } from "react-router-dom";

export const DesktopAppSettings = () => {
  const navigate = useNavigate();
  const { isDesktop, info, autoLaunch, toggleAutoLaunch, loading, api } = useDesktopApp();

  if (loading) return null;

  if (!isDesktop) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Desktop app
          </CardTitle>
          <CardDescription>
            Install ShadowTalk as software for native files, tray, and system notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate("/download")}>
            Get ShadowTalk Desktop
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5 text-primary" />
            Desktop app
          </CardTitle>
          <Badge variant="secondary">Active</Badge>
        </div>
        <CardDescription>
          v{info?.appVersion ?? "1.0.0"} · {info?.platform} · Electron {info?.electronVersion}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-launch">Launch at login</Label>
            <p className="text-xs text-muted-foreground">Start ShadowTalk when you sign in</p>
          </div>
          <Switch
            id="auto-launch"
            checked={autoLaunch}
            onCheckedChange={(v) => toggleAutoLaunch(v)}
          />
        </div>

        {info?.shadowtalkDataPath && (
          <div className="rounded-lg border border-border/50 p-3 text-xs space-y-2">
            <p className="font-medium flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" />
              App data folder
            </p>
            <code className="block break-all text-muted-foreground">{info.shadowtalkDataPath}</code>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => api?.openPath(info.userDataPath)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open in Finder / Explorer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
