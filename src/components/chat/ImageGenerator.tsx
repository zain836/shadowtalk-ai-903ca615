import { useState } from "react";
import { ImageIcon, Loader2, Download, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface ImageGeneratorProps {
  onClose: () => void;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
}

export const ImageGenerator = ({ onClose, onImageGenerated }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImage(null);
    setDescription("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          generateImage: true, 
          imagePrompt: prompt,
          messages: [],
          personality: "creative"
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          throw new Error(errorData.error || "Daily limit reached (100 images/day)");
        }
        throw new Error(errorData.error || "Image generation failed");
      }

      const data = await resp.json();
      console.log("Image generation response:", data);
      
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setDescription(data.content || "");
        onImageGenerated(data.imageUrl, prompt);
        toast({ title: "Image generated!" });
      } else if (data.content) {
        setDescription(data.content);
        toast({ 
          title: "Generation complete",
          description: "The AI provided a description instead of an image."
        });
      } else {
        throw new Error("No image returned");
      }
    } catch (error) {
      console.error("Image generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `shadowtalk-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <span className="font-medium">AI Image Generator</span>
            <span className="text-xs text-muted-foreground">(100/day limit)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Describe your image</label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cityscape at sunset with flying cars..."
              disabled={isGenerating}
              onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <p className="text-xs text-muted-foreground">
              Be descriptive! Include style, mood, colors, and composition details.
            </p>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="flex items-center justify-center py-16 bg-muted/30 rounded-lg border border-dashed border-border">
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Creating your image...</p>
                <p className="text-xs text-muted-foreground">This may take 10-30 seconds</p>
              </div>
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && !isGenerating && (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                <img 
                  src={generatedImage} 
                  alt={prompt}
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={handleDownload}
                    className="bg-background/80 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}

          {/* Description only (no image) */}
          {description && !generatedImage && !isGenerating && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {generatedImage && (
              <Button 
                variant="outline"
                onClick={() => {
                  setGeneratedImage(null);
                  setDescription("");
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                New Image
              </Button>
            )}
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className="btn-glow"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
