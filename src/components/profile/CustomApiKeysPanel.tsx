import { useState } from "react";
import { KeyRound, ExternalLink, Loader2, CheckCircle2, Trash2, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AI_PROVIDER_OPTIONS, type AiProviderId } from "@/lib/aiProviders";
import { useCustomApiKeys } from "@/hooks/useCustomApiKeys";

export const CustomApiKeysPanel = () => {
  const {
    keys,
    aiConfig,
    isLoading,
    isVerifying,
    isSaving,
    hasVerifiedKey,
    usingLocalFallback,
    verifyAndSave,
    removeKey,
    setDefault,
  } = useCustomApiKeys();

  const [provider, setProvider] = useState<AiProviderId>("google");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");

  const selectedMeta = AI_PROVIDER_OPTIONS.find((p) => p.id === provider)!;
  const busy = isVerifying || isSaving;

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    const ok = await verifyAndSave(provider, apiKey.trim(), label.trim() || undefined);
    if (ok) setApiKey("");
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Custom AI API Keys
        </CardTitle>
        <CardDescription>
          Connect your own chatbot API keys. ShadowTalk verifies each key with the provider, then
          automatically configures chat to use it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            Keys are encrypted server-side and never shown again after saving. Only you can use
            your keys for your account.
          </p>
        </div>

        {hasVerifiedKey && aiConfig.preferredProvider && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>
              Chat is using your{" "}
              <strong>{AI_PROVIDER_OPTIONS.find((p) => p.id === aiConfig.preferredProvider)?.name}</strong>{" "}
              key{usingLocalFallback ? " (this device)" : ""}
            </span>
          </div>
        )}
        {usingLocalFallback && (
          <p className="text-xs text-amber-500/90">
            Server key sync is not deployed yet — your key works on this device. Deploy the{" "}
            <code className="text-[10px]">user-provider-keys</code> edge function for encrypted cloud storage.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>AI provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as AiProviderId)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDER_OPTIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{selectedMeta.description}</p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="api-key">API key</Label>
            <Input
              id="api-key"
              type="password"
              autoComplete="off"
              placeholder={selectedMeta.keyPlaceholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={busy}
            />
            <a
              href={selectedMeta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Get a key from {selectedMeta.name}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-label">Label (optional)</Label>
            <Input
              id="key-label"
              placeholder="Work account"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full" onClick={handleConnect} disabled={busy || !apiKey.trim()}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & connect"
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Connected keys</h4>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys connected yet.</p>
          ) : (
            <ul className="space-y-2">
              {keys.map((k) => {
                const meta = AI_PROVIDER_OPTIONS.find((p) => p.id === k.provider);
                return (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border/50 bg-muted/20"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{meta?.name || k.provider}</span>
                        {k.is_default && (
                          <Badge variant="secondary" className="text-[10px]">
                            Default
                          </Badge>
                        )}
                        {k.verified_at && (
                          <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {k.key_prefix}
                        {k.label ? ` · ${k.label}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!k.is_default && (
                        <Button variant="outline" size="sm" onClick={() => setDefault(k.provider)}>
                          Set default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeKey(k.provider)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
