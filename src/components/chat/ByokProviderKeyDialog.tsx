import { useEffect, useState } from "react";
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
import { ExternalLink, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AIProvider } from "@/components/chat/ProviderSelector";
import {
  AI_PROVIDER_OPTIONS,
  loadCustomAiConfig,
  saveCustomAiConfig,
  type CustomAiProviderId,
} from "@/lib/customApiKeys";
import { toCustomAiProviderId, toServerProvider } from "@/lib/chatProviderBridge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useCustomApiKeys } from "@/hooks/useCustomApiKeys";

const BYOK_LABELS: Record<Exclude<AIProvider, "lovable">, { title: string; hint: string }> = {
  gemini: {
    title: "Google Gemini API key",
    hint: "Create a key in Google AI Studio. ShadowTalk will use it for chat on your account.",
  },
  openrouter: {
    title: "OpenRouter API key",
    hint: "One OpenRouter key unlocks many models. Billing stays on your OpenRouter account.",
  },
  kimi: {
    title: "Kimi / Moonshot API key",
    hint: "Use your Moonshot console key for Kimi-class models.",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AIProvider | null;
  onSaved: (provider: AIProvider) => void;
};

export function ByokProviderKeyDialog({ open, onOpenChange, provider, onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { verifyAndSave, usePlatformDefaultAi, isVerifying, isSaving } = useCustomApiKeys();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [testing, setTesting] = useState(false);

  const busy = testing || isVerifying || isSaving;
  const byok = provider && provider !== "lovable" ? provider : null;
  const meta = byok
    ? AI_PROVIDER_OPTIONS.find((p) => p.id === toCustomAiProviderId(byok))
    : undefined;
  const copy = byok ? BYOK_LABELS[byok] : null;

  useEffect(() => {
    if (open) {
      setApiKey("");
      setModel("");
    }
  }, [open, provider]);

  const handleSave = async () => {
    if (!byok || !meta) return;
    const trimmed = apiKey.trim();
    if (trimmed.length < 10) {
      toast({
        title: "API key required",
        description: "Paste a valid key from your provider console.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const serverId = toServerProvider(byok);
      if (user && serverId) {
        const ok = await verifyAndSave(serverId, trimmed);
        if (!ok) return;
        onSaved(byok);
        onOpenChange(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("test-custom-ai-key", {
        body: {
          provider: toCustomAiProviderId(byok) as CustomAiProviderId,
          apiKey: trimmed,
          model: model.trim() || undefined,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Key validation failed");

      await usePlatformDefaultAi();
      saveCustomAiConfig({
        ...loadCustomAiConfig(),
        provider: toCustomAiProviderId(byok),
        apiKey: trimmed,
        model: model.trim() || meta.defaultModel,
        usePlatformDefault: false,
        setupDismissed: false,
      });

      toast({
        title: "API key connected",
        description: `${meta.label} is ready for chat.`,
      });
      onSaved(byok);
      onOpenChange(false);
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

  if (!byok || !copy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1e1f20]/95 border-white/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5 text-primary" />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-left leading-relaxed">{copy.hint}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="byok-api-key">API key</Label>
            <Input
              id="byok-api-key"
              type="password"
              autoComplete="off"
              placeholder={meta?.keyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
              disabled={busy}
            />
            {meta?.docsUrl && (
              <a
                href={meta.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Get a key <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="byok-model">Model (optional)</Label>
            <Input
              id="byok-model"
              placeholder={meta?.defaultModel}
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="font-mono text-sm"
              disabled={busy}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Save & connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ByokProviderKeyDialog;
