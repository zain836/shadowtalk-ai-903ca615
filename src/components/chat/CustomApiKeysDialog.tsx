import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Key, ExternalLink, Loader2, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AI_PROVIDER_OPTIONS,
  type CustomAiProviderId,
  type CustomAiKeysConfig,
  maskApiKey,
} from "@/lib/customApiKeys";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CustomAiKeysConfig;
  onSave: (partial: Pick<CustomAiKeysConfig, "provider" | "apiKey" | "model">) => void;
  onUsePlatformDefault: () => void;
  onDismiss: () => void;
};

export function CustomApiKeysDialog({
  open,
  onOpenChange,
  config,
  onSave,
  onUsePlatformDefault,
  onDismiss,
}: Props) {
  const { toast } = useToast();
  const [provider, setProvider] = useState<CustomAiProviderId>(
    config.usePlatformDefault ? "openrouter" : config.provider,
  );
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model ?? "");
  const [testing, setTesting] = useState(false);

  const selectedMeta = AI_PROVIDER_OPTIONS.find((p) => p.id === provider);

  const testAndSave = async () => {
    if (provider === "lovable") {
      onUsePlatformDefault();
      return;
    }
    const trimmed = apiKey.trim();
    if (trimmed.length < 10) {
      toast({ title: "Invalid key", description: "Enter a valid API key.", variant: "destructive" });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-custom-ai-key", {
        body: { provider, apiKey: trimmed, model: model.trim() || undefined },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Key validation failed");

      onSave({
        provider,
        apiKey: trimmed,
        model: model.trim() || selectedMeta?.defaultModel,
      });
      toast({
        title: "API key saved",
        description: `ShadowTalk will use your ${selectedMeta?.label} key for chat and tools on this device.`,
      });
    } catch (e) {
      toast({
        title: "Could not verify key",
        description: e instanceof Error ? e.message : "Check the key and try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#1e1f20]/95 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Key className="h-5 w-5 text-primary" />
            Connect your AI API key
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed">
            Use your own Gemini, OpenRouter, or Kimi (Moonshot) key. Keys stay in your browser and are
            sent only when you use AI features — ShadowTalk does not store them on our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
            <Shield className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Billing goes to your provider account. All chat, documents, research, and tools will
              route through the key you save here.
            </p>
          </div>

          {config.apiKey && !config.usePlatformDefault && (
            <Badge variant="secondary" className="gap-1">
              Active: {maskApiKey(config.apiKey)} ({config.provider})
            </Badge>
          )}

          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as CustomAiProviderId)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDER_OPTIONS.filter((p) => p.id !== "lovable").map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMeta && (
              <p className="text-xs text-muted-foreground">{selectedMeta.description}</p>
            )}
          </div>

          {provider !== "lovable" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key">API key</Label>
                <Input
                  id="api-key"
                  type="password"
                  autoComplete="off"
                  placeholder={selectedMeta?.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                {selectedMeta?.docsUrl && (
                  <a
                    href={selectedMeta.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Get a key <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model (optional)</Label>
                <Input
                  id="model"
                  placeholder={selectedMeta?.defaultModel}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for the default. OpenRouter: use ids like{" "}
                  <code className="text-primary">moonshotai/kimi-k2</code> or{" "}
                  <code className="text-primary">google/gemini-2.5-pro</code>.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="ghost" className="sm:mr-auto" onClick={onDismiss}>
            Later
          </Button>
          <Button type="button" variant="outline" onClick={onUsePlatformDefault} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Use ShadowTalk default
          </Button>
          <Button type="button" onClick={testAndSave} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Save & verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CustomApiKeysDialog;
