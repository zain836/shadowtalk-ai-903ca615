import { useState, useRef, useEffect } from "react";
import { 
  Image, Upload, Wand2, Eraser, Paintbrush, Undo2, Redo2, 
  ZoomIn, ZoomOut, RotateCcw, Download, X, Loader2, 
  Sliders, Palette, Sun, Contrast, Droplet, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface ImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
  onSave: (imageUrl: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const ImageEditor = ({ isOpen, onClose, initialImage, onSave }: ImageEditorProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(initialImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  
  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);

  const [tool, setTool] = useState<"select" | "brush" | "eraser" | "magic">("select");
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState("#ffffff");

  useEffect(() => {
    if (initialImage) {
      setImage(initialImage);
      setHistory([initialImage]);
      setHistoryIndex(0);
    }
  }, [initialImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImage(dataUrl);
      setHistory([dataUrl]);
      setHistoryIndex(0);
    };
    reader.readAsDataURL(file);
  };

  const handleAIEdit = async () => {
    if (!image || !editPrompt.trim()) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          imageEdit: true,
          originalImage: image,
          editPrompt: editPrompt
        })
      });

      if (!resp.ok) throw new Error("Edit failed");

      const data = await resp.json();
      if (data.imageUrl) {
        const newImage = data.imageUrl;
        setImage(newImage);
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newImage]);
        setHistoryIndex(prev => prev + 1);
        toast({ title: "Image edited successfully!" });
      }
    } catch (error) {
      console.error("AI edit error:", error);
      toast({
        title: "Edit failed",
        description: "Could not apply AI edit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setEditPrompt("");
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setImage(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setImage(history[historyIndex + 1]);
    }
  };

  const applyFilters = () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
    img.src = image;
  };

  useEffect(() => {
    applyFilters();
  }, [image, brightness, contrast, saturation, blur, rotation]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `edited-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL());
    onClose();
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setRotation(0);
    setZoom(100);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex"
    >
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <Button
              variant={tool === "select" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("select")}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "brush" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("brush")}
            >
              <Paintbrush className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("eraser")}
            >
              <Eraser className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "magic" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTool("magic")}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(25, z - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <Button variant="ghost" size="sm" onClick={() => setRotation(r => r - 90)}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-[#1a1a2e]">
          {image ? (
            <div style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.2s' }}>
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full shadow-2xl rounded-lg"
              />
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-16 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium mb-2">Upload an image to edit</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* AI Edit Bar */}
        {image && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
              <Wand2 className="h-5 w-5 text-primary shrink-0" />
              <Input
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Describe how you want to edit this image... (e.g., 'change the sky to sunset')"
                disabled={isProcessing}
                onKeyPress={(e) => e.key === 'Enter' && handleAIEdit()}
                className="flex-1"
              />
              <Button onClick={handleAIEdit} disabled={isProcessing || !editPrompt.trim()}>
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Apply
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              {["Remove background", "Enhance colors", "Add depth blur", "Make it artistic", "Fix lighting"].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setEditPrompt(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Adjustments */}
      <div className="w-72 border-l border-border overflow-y-auto">
        <Tabs defaultValue="adjust" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="adjust" className="text-xs">
              <Sliders className="h-3 w-3 mr-1" />
              Adjust
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Wand2 className="h-3 w-3 mr-1" />
              AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="p-4 space-y-6">
            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Brightness
                </label>
                <span className="text-xs text-muted-foreground">{brightness}%</span>
              </div>
              <Slider
                value={[brightness]}
                onValueChange={([v]) => setBrightness(v)}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Contrast
                </label>
                <span className="text-xs text-muted-foreground">{contrast}%</span>
              </div>
              <Slider
                value={[contrast]}
                onValueChange={([v]) => setContrast(v)}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Saturation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Saturation
                </label>
                <span className="text-xs text-muted-foreground">{saturation}%</span>
              </div>
              <Slider
                value={[saturation]}
                onValueChange={([v]) => setSaturation(v)}
                min={0}
                max={200}
                step={1}
              />
            </div>

            {/* Blur */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm">Blur</label>
                <span className="text-xs text-muted-foreground">{blur}px</span>
              </div>
              <Slider
                value={[blur]}
                onValueChange={([v]) => setBlur(v)}
                min={0}
                max={20}
                step={1}
              />
            </div>

            <Button variant="outline" className="w-full" onClick={resetAdjustments}>
              Reset All
            </Button>
          </TabsContent>

          <TabsContent value="filters" className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: "Original", filter: "" },
                { name: "Grayscale", filter: "grayscale(100%)" },
                { name: "Sepia", filter: "sepia(100%)" },
                { name: "Vintage", filter: "sepia(50%) contrast(80%)" },
                { name: "Cold", filter: "saturate(80%) hue-rotate(180deg)" },
                { name: "Warm", filter: "saturate(120%) hue-rotate(-10deg)" },
                { name: "High Contrast", filter: "contrast(150%)" },
                { name: "Low Contrast", filter: "contrast(70%)" },
                { name: "Invert", filter: "invert(100%)" },
              ].map((preset) => (
                <button
                  key={preset.name}
                  className="aspect-square rounded-lg border border-border overflow-hidden hover:ring-2 ring-primary transition-all"
                  onClick={() => {
                    // Apply filter preset
                  }}
                >
                  <div
                    className="w-full h-full bg-gradient-to-br from-primary to-secondary"
                    style={{ filter: preset.filter }}
                  />
                  <span className="text-[10px] block mt-1">{preset.name}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">AI Actions</h3>
              {[
                { label: "Remove Object", desc: "Click on object to remove" },
                { label: "Expand Image", desc: "Extend borders with AI" },
                { label: "Upscale 4x", desc: "Enhance resolution" },
                { label: "Auto Enhance", desc: "Improve quality automatically" },
                { label: "Colorize", desc: "Add color to B&W images" },
                { label: "Style Transfer", desc: "Apply artistic styles" },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!image}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
