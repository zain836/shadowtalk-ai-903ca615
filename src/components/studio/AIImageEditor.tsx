import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Wand2, Download, RotateCcw, Image as ImageIcon,
  Sparkles, Eraser, Palette, ZoomIn, ZoomOut, Loader2,
  ArrowLeftRight, X
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Remove Background", icon: Eraser, prompt: "Remove the background completely, make it transparent white" },
  { label: "Enhance Quality", icon: Sparkles, prompt: "Enhance this image quality, make it sharper and more vibrant" },
  { label: "Change Style", icon: Palette, prompt: "Convert this image to a professional artistic style" },
  { label: "Upscale", icon: ZoomIn, prompt: "Upscale and enhance the resolution of this image" },
];

export const AIImageEditor: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<"edit" | "generate">("edit");

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOriginalImage(result);
      setEditedImage(null);
      setHistory([]);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setEditedImage(null);
      setHistory([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const processImage = useCallback(async (prompt: string) => {
    if (mode === "edit" && !originalImage) {
      toast({ title: "Upload an image first", variant: "destructive" });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: "Enter an instruction", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const sourceImage = editedImage || originalImage;
      const { data, error } = await supabase.functions.invoke("image-edit", {
        body: {
          instruction: prompt.trim(),
          imageBase64: mode === "edit" ? sourceImage : undefined,
          mode,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const newImage = data.images?.[0]?.image_url?.url;
      if (newImage) {
        if (editedImage) setHistory(prev => [...prev, editedImage]);
        setEditedImage(newImage);
        if (mode === "generate") setOriginalImage(newImage);
        toast({ title: "✨ Image processed successfully!" });
      } else {
        toast({ title: "AI response", description: data.text || "No image generated" });
      }
    } catch (err: any) {
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, editedImage, mode, toast]);

  const handleUndo = () => {
    if (history.length > 0) {
      setEditedImage(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
    } else {
      setEditedImage(null);
    }
  };

  const handleDownload = () => {
    const img = editedImage || originalImage;
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = `shadowtalk-edited-${Date.now()}.png`;
    a.click();
  };

  const displayImage = editedImage || originalImage;

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant={mode === "edit" ? "default" : "outline"}
          onClick={() => setMode("edit")}
          className="gap-2"
        >
          <Wand2 className="h-4 w-4" /> Edit Image
        </Button>
        <Button
          variant={mode === "generate" ? "default" : "outline"}
          onClick={() => setMode("generate")}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" /> Generate Image
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-0">
              {displayImage ? (
                <div className="relative group">
                  {showComparison && originalImage && editedImage ? (
                    <div className="grid grid-cols-2 gap-0.5 bg-muted">
                      <div className="relative">
                        <img src={originalImage} alt="Original" className="w-full h-auto max-h-[600px] object-contain" />
                        <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur">Original</Badge>
                      </div>
                      <div className="relative">
                        <img src={editedImage} alt="Edited" className="w-full h-auto max-h-[600px] object-contain" />
                        <Badge className="absolute top-3 left-3 bg-primary/80 backdrop-blur text-primary-foreground">Edited</Badge>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={displayImage}
                      alt="Working image"
                      className="w-full h-auto max-h-[600px] object-contain bg-muted/30"
                    />
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editedImage && originalImage && (
                      <Button size="sm" variant="secondary" onClick={() => setShowComparison(!showComparison)} className="gap-1 backdrop-blur bg-background/70">
                        <ArrowLeftRight className="h-3 w-3" /> Compare
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={handleDownload} className="gap-1 backdrop-blur bg-background/70">
                      <Download className="h-3 w-3" /> Save
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setOriginalImage(null); setEditedImage(null); setHistory([]); }} className="backdrop-blur bg-background/70">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">AI is working its magic...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div
                  className="h-[400px] flex flex-col items-center justify-center gap-4 cursor-pointer"
                  onClick={() => mode === "edit" && fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {mode === "edit" ? (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground/50" />
                      <div className="text-center">
                        <p className="text-muted-foreground font-medium">Drop an image here or click to upload</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, WebP — Max 10MB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-12 w-12 text-primary/50" />
                      <p className="text-muted-foreground font-medium">Describe the image you want to generate</p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Quick Actions */}
          {mode === "edit" && originalImage && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => processImage(action.prompt)}
                    className="gap-1.5 text-xs h-auto py-2 justify-start"
                  >
                    <action.icon className="h-3.5 w-3.5 shrink-0" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Custom Instruction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {mode === "edit" ? "Edit Instruction" : "Generation Prompt"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={
                  mode === "edit"
                    ? "e.g. Remove the person in the background, make the sky more dramatic..."
                    : "e.g. A futuristic city skyline at sunset, cyberpunk style, 4K..."
                }
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={4}
                maxLength={2000}
                className="resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => processImage(instruction)}
                  disabled={isProcessing || !instruction.trim() || (mode === "edit" && !originalImage)}
                  className="flex-1 gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {mode === "edit" ? "Apply Edit" : "Generate"}
                </Button>
                {editedImage && (
                  <Button variant="outline" size="icon" onClick={handleUndo} title="Undo">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Edit History ({history.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {history.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`v${i + 1}`}
                      className="h-16 w-16 rounded border object-cover shrink-0 cursor-pointer hover:ring-2 ring-primary transition-all"
                      onClick={() => {
                        setEditedImage(img);
                        setHistory(prev => prev.filter((_, idx) => idx !== i));
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImageEditor;
