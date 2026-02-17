import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Globe, Palette, Monitor, Moon, Sun, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

export const PreferencesTab = () => {
  const { theme, setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [language, setLanguage] = useState("en");

  return (
    <motion.div {...tabMotion} className="space-y-6">
      {/* Appearance */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">Theme</p>
                <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-28 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Monitor className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Compact Mode</p>
                <p className="text-xs text-muted-foreground">Reduce spacing for more content density</p>
              </div>
            </div>
            <Switch checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Volume2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Play sounds for notifications and actions</p>
              </div>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Language & Region
          </CardTitle>
          <CardDescription>Set your preferred language and regional settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Language</p>
                <p className="text-xs text-muted-foreground">Select your preferred language</p>
              </div>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-32 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
