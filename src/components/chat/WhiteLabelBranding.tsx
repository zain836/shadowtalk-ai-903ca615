import { useState, useEffect } from "react";
import { X, Palette, Type, Image, Save, RotateCcw, Eye, Upload, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface BrandingConfig {
  appName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  fontFamily: string;
  borderRadius: string;
  customDomain?: string;
}

const defaultBranding: BrandingConfig = {
  appName: "ShadowTalk AI",
  tagline: "Powered by Gemini",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#38bdf8",
  secondaryColor: "#a855f7",
  accentColor: "#ec4899",
  backgroundColor: "#050508",
  foregroundColor: "#fafafa",
  fontFamily: "Inter",
  borderRadius: "0.75rem",
};

interface WhiteLabelBrandingProps {
  onClose: () => void;
  workspaceId?: string;
}

export const WhiteLabelBranding = ({ onClose, workspaceId }: WhiteLabelBrandingProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const saved = localStorage.getItem('white-label-branding');
    return saved ? JSON.parse(saved) : defaultBranding;
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(workspaceId || null);

  // Load branding from database if workspaceId is provided
  useEffect(() => {
    if (!user) return;
    
    const loadBranding = async () => {
      setIsLoading(true);
      try {
        // If no workspaceId, try to get user's default workspace or create one
        let wsId = currentWorkspaceId;
        
        if (!wsId) {
          const { data: workspaces } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);
          
          if (workspaces && workspaces.length > 0) {
            wsId = workspaces[0].id;
            setCurrentWorkspaceId(wsId);
          } else {
            // Create a default workspace for the user
            const slug = `workspace-${user.id.slice(0, 8)}`;
            const { data: newWorkspace, error: createError } = await supabase
              .from('workspaces')
              .insert({
                name: 'My Workspace',
                slug,
                owner_id: user.id,
              })
              .select()
              .single();

            if (newWorkspace && !createError) {
              wsId = newWorkspace.id;
              setCurrentWorkspaceId(wsId);
            }
          }
        }

        if (wsId) {
          const { data: brandingData, error } = await supabase
            .from('workspace_branding')
            .select('*')
            .eq('workspace_id', wsId)
            .single();

          if (brandingData && !error) {
            setBranding({
              appName: brandingData.app_name || defaultBranding.appName,
              tagline: brandingData.tagline || defaultBranding.tagline,
              logoUrl: brandingData.logo_url || '',
              faviconUrl: brandingData.favicon_url || '',
              primaryColor: brandingData.primary_color || defaultBranding.primaryColor,
              secondaryColor: brandingData.secondary_color || defaultBranding.secondaryColor,
              accentColor: brandingData.accent_color || defaultBranding.accentColor,
              backgroundColor: brandingData.background_color || defaultBranding.backgroundColor,
              foregroundColor: brandingData.foreground_color || defaultBranding.foregroundColor,
              fontFamily: brandingData.font_family || defaultBranding.fontFamily,
              borderRadius: brandingData.border_radius || defaultBranding.borderRadius,
              customDomain: brandingData.custom_domain || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBranding();
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    if (previewMode) {
      applyBranding(branding);
    }
  }, [previewMode, branding]);

  const applyBranding = (config: BrandingConfig) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    root.style.setProperty('--primary', hexToHSL(config.primaryColor));
    root.style.setProperty('--secondary', hexToHSL(config.secondaryColor));
    root.style.setProperty('--accent', hexToHSL(config.accentColor));
    root.style.setProperty('--background', hexToHSL(config.backgroundColor));
    root.style.setProperty('--foreground', hexToHSL(config.foregroundColor));
    root.style.setProperty('--radius', config.borderRadius);
    root.style.setProperty('font-family', config.fontFamily);

    // Update document title
    document.title = config.appName;
  };

  const saveBranding = async () => {
    // Always save to localStorage for immediate effect
    localStorage.setItem('white-label-branding', JSON.stringify(branding));
    applyBranding(branding);

    // If user is logged in and has a workspace, save to database
    if (user && currentWorkspaceId) {
      setIsSaving(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke('save-workspace-branding', {
          body: {
            workspaceId: currentWorkspaceId,
            appName: branding.appName,
            tagline: branding.tagline,
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            backgroundColor: branding.backgroundColor,
            foregroundColor: branding.foregroundColor,
            fontFamily: branding.fontFamily,
            borderRadius: branding.borderRadius,
            customDomain: branding.customDomain || null,
          },
        });

        if (response.error) {
          // Check if it's a feature lock error
          if (response.error.message?.includes('Feature locked') || response.error.message?.includes('403')) {
            toast({
              title: "Feature locked",
              description: "White-label branding requires Elite or Enterprise tier. Saved locally only.",
              variant: "destructive"
            });
          } else {
            throw response.error;
          }
        } else {
          toast({ 
            title: "Branding saved", 
            description: "Your custom branding has been saved to your workspace" 
          });
        }
      } catch (error) {
        console.error('Error saving branding:', error);
        toast({ 
          title: "Saved locally", 
          description: "Branding saved to this browser. Sign in with Elite tier for cloud sync." 
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      toast({ title: "Branding saved", description: "Your custom branding has been applied" });
    }
  };

  const resetBranding = () => {
    setBranding(defaultBranding);
    localStorage.removeItem('white-label-branding');
    applyBranding(defaultBranding);
    toast({ title: "Branding reset", description: "Default branding has been restored" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading branding settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">White-Label Branding</h2>
              <p className="text-xs text-muted-foreground">
                {currentWorkspaceId ? 'Synced to workspace' : 'Local storage only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="rounded-xl"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Preview On' : 'Preview'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="identity">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-6">
              {/* App Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  App Name
                </Label>
                <Input
                  value={branding.appName}
                  onChange={e => setBranding({ ...branding, appName: e.target.value })}
                  placeholder="Your App Name"
                  className="rounded-xl"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={branding.tagline}
                  onChange={e => setBranding({ ...branding, tagline: e.target.value })}
                  placeholder="Your tagline here"
                  className="rounded-xl"
                />
              </div>

              {/* Custom Domain */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Custom Domain
                  <span className="text-xs text-muted-foreground">(Enterprise)</span>
                </Label>
                <Input
                  value={branding.customDomain || ''}
                  onChange={e => setBranding({ ...branding, customDomain: e.target.value })}
                  placeholder="chat.yourdomain.com"
                  className="rounded-xl"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Logo
                </Label>
                <div className="flex items-center gap-4">
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-muted" />
                  )}
                  <label className="flex-1">
                    <div className="flex items-center justify-center h-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="text-sm">Upload Logo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'logoUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-2">
                <Label>Favicon</Label>
                <div className="flex items-center gap-4">
                  {branding.faviconUrl && (
                    <img src={branding.faviconUrl} alt="Favicon" className="h-8 w-8 rounded object-contain bg-muted" />
                  )}
                  <label className="flex-1">
                    <div className="flex items-center justify-center h-12 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors">
                      <Upload className="h-4 w-4 mr-2" />
                      <span className="text-sm">Upload Favicon</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleLogoUpload(e, 'faviconUrl')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={e => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={e => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={e => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={e => setBranding({ ...branding, accentColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={e => setBranding({ ...branding, accentColor: e.target.value })}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.backgroundColor}
                      onChange={e => setBranding({ ...branding, backgroundColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <Input
                      value={branding.backgroundColor}
                      onChange={e => setBranding({ ...branding, backgroundColor: e.target.value })}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>

                {/* Foreground Color */}
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.foregroundColor}
                      onChange={e => setBranding({ ...branding, foregroundColor: e.target.value })}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0"
                    />
                    <Input
                      value={branding.foregroundColor}
                      onChange={e => setBranding({ ...branding, foregroundColor: e.target.value })}
                      className="rounded-xl flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="p-4 rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-3">Preview</p>
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: branding.primaryColor }} />
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: branding.secondaryColor }} />
                  <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: branding.accentColor }} />
                  <div className="h-10 flex-1 rounded-lg border" style={{ backgroundColor: branding.backgroundColor }} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="styling" className="space-y-6">
              {/* Font Family */}
              <div className="space-y-2">
                <Label>Font Family</Label>
                <select
                  value={branding.fontFamily}
                  onChange={e => setBranding({ ...branding, fontFamily: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Lato">Lato</option>
                  <option value="Nunito">Nunito</option>
                  <option value="Playfair Display">Playfair Display</option>
                </select>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <select
                  value={branding.borderRadius}
                  onChange={e => setBranding({ ...branding, borderRadius: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3"
                >
                  <option value="0">Sharp (0)</option>
                  <option value="0.25rem">Subtle (0.25rem)</option>
                  <option value="0.5rem">Rounded (0.5rem)</option>
                  <option value="0.75rem">More Rounded (0.75rem)</option>
                  <option value="1rem">Very Rounded (1rem)</option>
                  <option value="1.5rem">Pill (1.5rem)</option>
                </select>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button variant="outline" onClick={resetBranding} className="rounded-xl">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={saveBranding} className="btn-glow rounded-xl" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Branding
          </Button>
        </div>
      </div>
    </div>
  );
};
