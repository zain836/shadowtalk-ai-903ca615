import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Monitor,
  FolderOpen,
  Bell,
  Zap,
  Shield,
  HardDrive,
  Terminal,
  Apple,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDesktopApp } from "@/hooks/useDesktopApp";

const DESKTOP_FEATURES = [
  {
    icon: FolderOpen,
    title: "Native file access",
    description: "Open and save documents with your OS file picker — not limited to browser uploads.",
  },
  {
    icon: HardDrive,
    title: "Local data folder",
    description: "Vault exports, offline models, and caches live in a dedicated app data directory.",
  },
  {
    icon: Bell,
    title: "System notifications",
    description: "Agent completions and updates appear in your desktop notification center.",
  },
  {
    icon: Zap,
    title: "Tray & background",
    description: "Keep ShadowTalk in the system tray while agents run; return when tasks finish.",
  },
  {
    icon: Shield,
    title: "Stronger offline path",
    description: "On-device Gemma and WebGPU work best in the desktop shell with persistent storage.",
  },
  {
    icon: Monitor,
    title: "Full workspace window",
    description: "1280×860 default layout tuned for chat, Mission Control, and multi-panel tools.",
  },
];

const BUILD_STEPS = [
  "npm install",
  "npm run build",
  "npm run desktop:make",
];

const DownloadPage = () => {
  const navigate = useNavigate();
  const { isDesktop, info } = useDesktopApp();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/40">
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            ShadowTalk Desktop
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Install ShadowTalk as <span className="gradient-text">real software</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The desktop app uses Electron to reach your files, notifications, and system tray —
            while keeping the same ShadowTalk AI workspace you use in the browser.
          </p>
        </div>

        {isDesktop ? (
          <Card className="mb-10 border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <p className="text-center text-sm">
                You are running <strong>ShadowTalk Desktop</strong>
                {info?.appVersion ? ` v${info.appVersion}` : ""} on{" "}
                <strong>{info?.platform ?? "desktop"}</strong>.
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate("/chatbot")}>Open workspace</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Windows
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Build produces an <code className="text-xs">.exe</code> installer via{" "}
                <code className="text-xs">npm run desktop:make</code>. Publish installers from
                GitHub Releases for one-click download.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Apple className="h-4 w-4 text-primary" />
                  macOS
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Build produces a <code className="text-xs">.dmg</code>. Users may need to allow the
                app in Privacy &amp; Security on first launch.
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Linux
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AppImage / deb targets can be added in{" "}
                <code className="text-xs">electron-builder.config.json</code>.
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {DESKTOP_FEATURES.map((f) => (
            <Card key={f.title} className="border-border/50">
              <CardContent className="pt-6">
                <f.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Build from source (developers &amp; self-host)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ShadowTalk ships with a Capacitor + Electron shell under <code>electron/</code>.
              After building the web app, package the desktop binary:
            </p>
            <pre className="rounded-lg bg-muted/50 p-4 text-xs overflow-x-auto font-mono">
              {BUILD_STEPS.join("\n")}
            </pre>
            <p className="text-xs text-muted-foreground">
              Output installers appear in <code>electron/dist/</code>. Host them on GitHub Releases
              and link the download buttons here for end users.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/docs")} variant="outline">
                Read docs
              </Button>
              <Button onClick={() => navigate("/chatbot")} className="btn-glow">
                Continue in browser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default DownloadPage;
