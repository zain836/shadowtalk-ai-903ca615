import { useState } from "react";
import { 
  Sparkles, Palette, Code, Image, Music, FileText,
  Loader2, X, Download, Copy, Play, ChevronRight,
  Wand2, Layers, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CreativeOutput {
  type: "poem" | "code" | "image" | "visualization" | "music" | "document";
  content: string;
  imageUrl?: string;
}

interface CreativeSynthesisProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (content: string) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SYNTHESIS_EXAMPLES = [
  {
    title: "Feeling → Art",
    description: "Transform an emotion into a poem, code visualization, and image",
    prompt: "I feel overwhelmed but hopeful, like a storm clearing to reveal sunshine",
    outputs: ["poem", "code", "image"]
  },
  {
    title: "Concept → Creation",
    description: "Turn an abstract idea into multiple creative forms",
    prompt: "The passage of time and memory",
    outputs: ["poem", "code", "visualization"]
  },
  {
    title: "Story → Experience",
    description: "Convert a narrative into visual and interactive elements",
    prompt: "A journey from darkness to light, finding courage along the way",
    outputs: ["document", "image", "code"]
  }
];

export const CreativeSynthesis = ({ isOpen, onClose, onInsertToChat }: CreativeSynthesisProps) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [outputs, setOutputs] = useState<CreativeOutput[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["poem", "code", "image"]);

  const outputTypes = [
    { id: "poem", label: "Poetry", icon: FileText, color: "text-pink-500" },
    { id: "code", label: "Code Art", icon: Code, color: "text-blue-500" },
    { id: "image", label: "Visual", icon: Image, color: "text-green-500" },
    { id: "visualization", label: "Data Viz", icon: Layers, color: "text-purple-500" },
    { id: "music", label: "Music", icon: Music, color: "text-amber-500" },
    { id: "document", label: "Document", icon: FileText, color: "text-cyan-500" },
  ];

  const toggleOutput = (id: string) => {
    setSelectedOutputs(prev => 
      prev.includes(id) 
        ? prev.filter(o => o !== id) 
        : [...prev, id]
    );
  };

  const generateCreativeOutputs = async () => {
    if (!theme.trim()) return;

    setIsGenerating(true);
    setOutputs([]);
    setCurrentStep(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      for (let i = 0; i < selectedOutputs.length; i++) {
        const outputType = selectedOutputs[i];
        setCurrentStep(i + 1);

        const prompts: Record<string, string> = {
          poem: `Write a beautiful, evocative poem inspired by this theme: "${theme}". 
                 Use vivid imagery and emotional depth. Format it with proper line breaks.`,
          code: `Create a piece of generative art code (JavaScript/p5.js) that visualizes this theme: "${theme}".
                 The code should be beautiful, working, and create an animated visual representation.
                 Include comments explaining how the code captures the theme.`,
          image: `Describe in detail an image that captures the essence of: "${theme}".
                  Include colors, composition, mood, and symbolic elements.`,
          visualization: `Create Python code using matplotlib or plotly to visualize data that represents: "${theme}".
                         Make it aesthetically pleasing with appropriate colors and styling.`,
          music: `Describe a musical composition that captures the feeling of: "${theme}".
                  Include tempo, key, instruments, dynamics, and emotional progression.`,
          document: `Write a short creative essay or prose piece exploring the theme: "${theme}".
                    Use poetic language and deep reflection.`
        };

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompts[outputType] }],
            personality: "creative",
            mode: outputType === "code" || outputType === "visualization" ? "code" : "creative"
          })
        });

        if (!resp.ok) throw new Error(`Generation failed for ${outputType}`);

        // Parse streaming response
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let content = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const c = data.choices?.[0]?.delta?.content;
                if (c) content += c;
              } catch {}
            }
          }
        }

        setOutputs(prev => [...prev, {
          type: outputType as CreativeOutput["type"],
          content
        }]);
      }

      toast({ title: "Creative synthesis complete!" });

    } catch (error) {
      console.error("Synthesis error:", error);
      toast({
        title: "Generation failed",
        description: "Could not complete creative synthesis.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getOutputIcon = (type: string) => {
    const output = outputTypes.find(o => o.id === type);
    return output ? <output.icon className={`h-5 w-5 ${output.color}`} /> : null;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              Creative Synthesis
              <Badge variant="secondary" className="text-xs">Multi-Modal</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Transform abstract thoughts into multiple creative forms
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-[400px] border-r border-border p-6 flex flex-col">
          <div className="space-y-6 flex-1">
            {/* Theme Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Your Theme or Feeling</label>
              <Textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Describe a feeling, theme, or abstract concept...

Example: 'The bittersweet feeling of watching the seasons change, knowing time moves forward but memories remain'"
                className="min-h-[120px]"
                disabled={isGenerating}
              />
            </div>

            {/* Output Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Output Types</label>
              <div className="grid grid-cols-3 gap-2">
                {outputTypes.map((output) => (
                  <button
                    key={output.id}
                    onClick={() => toggleOutput(output.id)}
                    disabled={isGenerating}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedOutputs.includes(output.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <output.icon className={`h-5 w-5 mx-auto ${output.color}`} />
                    <span className="text-xs mt-1 block">{output.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Examples */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quick Examples</label>
              <div className="space-y-2">
                {SYNTHESIS_EXAMPLES.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTheme(example.prompt);
                      setSelectedOutputs(example.outputs);
                    }}
                    disabled={isGenerating}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary/50 text-left transition-colors"
                  >
                    <div className="font-medium text-sm">{example.title}</div>
                    <div className="text-xs text-muted-foreground">{example.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateCreativeOutputs}
            disabled={!theme.trim() || selectedOutputs.length === 0 || isGenerating}
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Synthesizing... ({currentStep}/{selectedOutputs.length})
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Creative Works
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Outputs */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {outputs.length > 0 ? (
              <div className="space-y-6">
                {/* Flow Visualization */}
                <div className="flex items-center justify-center gap-2 py-4">
                  <Badge variant="outline" className="py-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Theme
                  </Badge>
                  {outputs.map((output, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary" className="py-1">
                        {getOutputIcon(output.type)}
                        <span className="ml-1 capitalize">{output.type}</span>
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Output Cards */}
                <div className="grid gap-6">
                  {outputs.map((output, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-lg">
                            <span className="flex items-center gap-2">
                              {getOutputIcon(output.type)}
                              <span className="capitalize">{output.type}</span>
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(output.content)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onInsertToChat(output.content)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {output.type === "code" || output.type === "visualization" ? (
                            <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto max-h-[300px]">
                              <code>{output.content}</code>
                            </pre>
                          ) : output.type === "poem" ? (
                            <div className="text-sm whitespace-pre-wrap font-serif italic leading-relaxed">
                              {output.content}
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap">
                              {output.content}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Palette className="h-20 w-20 text-muted-foreground/30 mb-6" />
                <h3 className="text-xl font-medium mb-2">Creative Synthesis</h3>
                <p className="text-muted-foreground max-w-md">
                  Describe an abstract thought, feeling, or theme. I'll transform it into 
                  multiple creative forms—poetry, code art, visualizations, and more.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
};
