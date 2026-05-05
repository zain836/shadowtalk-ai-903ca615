import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cpu, Download, Trash2, Wifi, Zap, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { useGemmaOffline } from "@/hooks/useGemmaOffline";
import { useToast } from "@/hooks/use-toast";
import { deleteModel, getModelStatus, isOpfsAvailable, type ModelStatus } from "@/lib/offline/opfsModelStore";
import type { GemmaModelKey } from "@/lib/offline/gemmaEngine";

/**
 * Settings panel — Opt-in download of on-device Gemma + routing preferences.
 * This is the user-facing surface that ships with the new offline mode.
 */
export const OfflineAISettings = () => {
  const {
    capabilities,
    isOnline,
    isReady,
    isLoading,
    progress,
    error,
    routingMode,
    preferredModel,
    models,
    loadModel,
    unloadModel,
    updateRoutingMode,
    updatePreferredModel,
  } = useGemmaOffline();
  const { toast } = useToast();
  const [opfsOk, setOpfsOk] = useState(true);
  const [storedStatus, setStoredStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    isOpfsAvailable().then(setOpfsOk);
  }, []);

  useEffect(() => {
    getModelStatus(models[preferredModel].id).then(setStoredStatus);
  }, [preferredModel, isReady, models]);

  const onDownload = async () => {
    if (!capabilities?.webgpu) {
      const ok = window.confirm(
        "WebGPU isn't available on this device. The model will run on CPU (WASM) — it works but is much slower. Continue?",
      );
      if (!ok) return;
    }
    const sizeMB = models[preferredModel].sizeMB;
    const ok = window.confirm(
      `This will download ${models[preferredModel].label} (~${sizeMB} MB) to your device. ` +
        `It runs entirely offline after that. Continue?`,
    );
    if (!ok) return;

    const success = await loadModel(preferredModel);
    if (success) {
      toast({
        title: "✅ Offline AI ready",
        description: `${models[preferredModel].label} is now running on your device.`,
      });
    } else {
      toast({
        title: "Download failed",
        description: error ?? "Couldn't load the on-device model.",
        variant: "destructive",
      });
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Remove the downloaded model from this device?")) return;
    await unloadModel();
    await deleteModel(models[preferredModel].id);
    setStoredStatus(null);
    toast({ title: "Model removed", description: "Cloud mode will be used until you re-download." });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <CardTitle>On-Device AI (Beta)</CardTitle>
          <Badge variant={isOnline ? "secondary" : "default"}>
            <Wifi className="h-3 w-3 mr-1" />
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
        <CardDescription>
          Run a Gemma model fully on your device for offline use. Downloads happen only when you ask.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capability summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">WebGPU</div>
            <div className="font-medium">{capabilities?.webgpu ? "✅ Available" : "❌ Unavailable"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Device memory</div>
            <div className="font-medium">{capabilities?.memoryGB ?? "?"} GB</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">OPFS storage</div>
            <div className="font-medium">{opfsOk ? "✅ Available" : "❌ Unavailable"}</div>
          </div>
          <div className="rounded-md border p-2">
            <div className="text-muted-foreground">Status</div>
            <div className="font-medium">
              {isReady ? "Loaded" : isLoading ? "Loading…" : storedStatus ? "Cached" : "Not installed"}
            </div>
          </div>
        </div>

        {/* Model picker */}
        <div className="space-y-2">
          <Label>Model</Label>
          <RadioGroup
            value={preferredModel === "default" ? "e2b" : preferredModel}
            onValueChange={(v) => updatePreferredModel(v as GemmaModelKey)}
            className="grid sm:grid-cols-2 gap-2"
          >
            {(["e2b", "e4b"] as GemmaModelKey[]).map((key) => {
              const m = models[key];
              return (
                <label
                  key={key}
                  htmlFor={`model-${key}`}
                  className="flex flex-col gap-1 rounded-md border p-3 cursor-pointer hover:border-primary"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id={`model-${key}`} value={key} />
                    <span className="font-medium text-sm">{m.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">~{(m.sizeMB / 1024).toFixed(1)} GB · needs {m.minMemoryGB} GB RAM</span>
                </label>
              );
            })}
          </RadioGroup>
          <p className="text-[11px] text-muted-foreground">
            Real Gemma 3n weights from Hugging Face (onnx-community). Downloads run in the background — you can navigate away and come back.
          </p>
        </div>

        {/* Routing mode */}
        <div className="space-y-2">
          <Label>Routing</Label>
          <RadioGroup
            value={routingMode}
            onValueChange={(v) => updateRoutingMode(v as any)}
            className="grid sm:grid-cols-3 gap-2"
          >
            {[
              { id: "auto", title: "Auto (recommended)", desc: "Local for simple, cloud for complex." },
              { id: "local-only", title: "Local only", desc: "Always on-device. Falls back if not loaded." },
              { id: "cloud-only", title: "Cloud only", desc: "Disable on-device entirely." },
            ].map((opt) => (
              <label
                key={opt.id}
                htmlFor={`route-${opt.id}`}
                className="flex flex-col gap-1 rounded-md border p-3 cursor-pointer hover:border-primary"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id={`route-${opt.id}`} value={opt.id} />
                  <span className="font-medium text-sm">{opt.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Progress */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress?.message || "Preparing…"}</span>
              <span>{progress?.percent ?? 0}%</span>
            </div>
            <Progress value={progress?.percent ?? 0} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={onDownload} disabled={isLoading || !opfsOk}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isReady ? "Reload model" : storedStatus ? "Load cached model" : "Download model"}
          </Button>
          {(storedStatus || isReady) && (
            <Button variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove model
            </Button>
          )}
        </div>

        <div className="rounded-md bg-muted/30 p-3 text-xs space-y-1 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Conversations using on-device AI never leave your machine.
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" />
            WebGPU acceleration available on Chrome/Edge desktop. CPU fallback works elsewhere but is slower.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OfflineAISettings;
