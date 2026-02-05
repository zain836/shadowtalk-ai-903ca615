import { useState } from "react";
import { 
  Sparkles, Palette, Code, Image, Music, FileText,
  Loader2, X, Download, Copy, ChevronRight,
  Wand2, Layers, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CreativeOutput {
  type: "poem" | "code" | "image" | "visualization" | "music" | "document";
  content: string;
  imageUrl?: string;
  isGenerating?: boolean;
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

// Professional formatting prompts
const getPrompt = (type: string, theme: string): string => {
  const prompts: Record<string, string> = {
    poem: `Create an exquisite, professionally formatted poem inspired by: "${theme}"

Structure your response EXACTLY as follows:

# [Creative Title]

*[One-line epigraph or dedication in italics]*

---

[Stanza 1 - 4 lines with vivid imagery]

[Stanza 2 - 4 lines building emotional depth]

[Stanza 3 - 4 lines with metaphor and symbolism]

[Final Stanza - 4 lines with powerful resolution]

---

*— Written in the style of [appropriate poetry movement]*

Use rich literary devices: metaphor, alliteration, assonance, enjambment. Each line should be emotionally resonant.`,

    code: `Create a stunning generative art piece in JavaScript/p5.js that visualizes: "${theme}"

Format your response as professional code documentation:

\`\`\`javascript
/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 [CREATIVE TITLE] - Generative Art
 * ═══════════════════════════════════════════════════════════════
 * 
 * Theme: ${theme}
 * Artist: AI Creative Synthesis
 * 
 * This piece explores [brief artistic statement]
 * 
 * INSTRUCTIONS:
 * 1. Copy this code to p5.js Web Editor (https://editor.p5js.org)
 * 2. Click Play to see the animation
 * 3. Press 'S' to save a frame
 * ═══════════════════════════════════════════════════════════════
 */

// === CONFIGURATION ===
const CONFIG = {
  // Customize these values
};

function setup() {
  createCanvas(800, 800);
  // initialization
}

function draw() {
  // Beautiful, commented animation code
  // Use proper sections and comments
}

// === HELPER FUNCTIONS ===

// === KEYBOARD INTERACTIONS ===
function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('artwork', 'png');
  }
}
\`\`\`

**How this code captures the theme:**
- [Explain visual element 1]
- [Explain visual element 2]
- [Explain color/motion choices]`,

    image: `Generate a detailed image based on: "${theme}"

Create a vivid, artistic image that captures the essence of this theme.`,

    visualization: `Create a professional data visualization in Python that represents: "${theme}"

Format as publication-ready code:

\`\`\`python
"""
╔══════════════════════════════════════════════════════════════════╗
║  📊 [VISUALIZATION TITLE]                                        ║
║  Theme: ${theme}                                                  ║
╚══════════════════════════════════════════════════════════════════╝

This visualization transforms abstract concepts into data patterns.

Requirements:
    pip install matplotlib numpy seaborn
    
Usage:
    python visualization.py
"""

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from matplotlib import cm

# ══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════

plt.style.use('seaborn-v0_8-whitegrid')
COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']

# ══════════════════════════════════════════════════════════════════
# DATA GENERATION - Representing the theme through numbers
# ══════════════════════════════════════════════════════════════════

# [Meaningful data that represents the theme]

# ══════════════════════════════════════════════════════════════════
# VISUALIZATION
# ══════════════════════════════════════════════════════════════════

fig, ax = plt.subplots(figsize=(12, 8), dpi=150)

# [Beautiful plotting code with annotations]

plt.tight_layout()
plt.savefig('visualization.png', dpi=300, bbox_inches='tight')
plt.show()
\`\`\`

**Interpretation:**
- Each data point represents [meaning]
- The visualization shows [insight]`,

    music: `Compose a detailed musical score description for: "${theme}"

Format as a professional composition sheet:

---

# 🎼 [Composition Title]

**Composer:** AI Creative Synthesis  
**Theme:** ${theme}  
**Duration:** ~4-5 minutes

---

## I. Movement Overview

| Section | Tempo | Time Sig. | Key | Duration |
|---------|-------|-----------|-----|----------|
| Intro | Adagio (♩=60) | 4/4 | [key] | 0:00-0:45 |
| Theme A | Andante (♩=80) | 4/4 | [key] | 0:45-1:30 |
| Development | Allegro (♩=120) | 6/8 | [modulation] | 1:30-3:00 |
| Recapitulation | Moderato (♩=90) | 4/4 | [key] | 3:00-4:00 |
| Coda | Largo (♩=50) | 4/4 | [key] | 4:00-4:30 |

---

## II. Instrumentation

**Strings:** Violin I, Violin II, Viola, Cello, Bass  
**Woodwinds:** Flute, Oboe, Clarinet  
**Brass:** French Horn, Trumpet (muted)  
**Percussion:** Timpani, Glockenspiel, Suspended Cymbal  
**Keys:** Piano, Celesta

---

## III. Detailed Score

### Introduction (Adagio, ♩=60)
- **Bars 1-4:** *pp* - Solo cello introduces the main motif
- **Bars 5-8:** Strings join with sustained harmonies
- **Dynamics:** *pp → mp* crescendo

### Theme A (Andante, ♩=80)
[Continue with detailed bar-by-bar description]

---

## IV. Performance Notes

- Use *rubato* liberally in the introduction
- Maintain *legato* phrasing throughout strings
- [Additional performance guidance]

---

*This composition translates "${theme}" into sound through [explain musical choices]*`,

    document: `Write a polished, professional creative essay on: "${theme}"

Format as a publication-ready piece:

---

# [Evocative Title]

*A Meditation on ${theme}*

---

## Prologue

*[Opening epigraph - a relevant quote or original aphorism]*

---

[Opening paragraph - Hook the reader with vivid imagery or a provocative statement. Set the tone and introduce the central theme. 3-4 sentences.]

---

## I. [First Section Title]

[Explore the first facet of the theme. Use concrete examples, sensory details, and personal reflection. Build toward an insight. 2-3 paragraphs.]

---

## II. [Second Section Title]

[Deepen the exploration. Introduce tension, complexity, or a contrasting perspective. Draw connections to universal human experience. 2-3 paragraphs.]

---

## III. [Third Section Title]

[Move toward resolution or synthesis. Weave together earlier threads. Offer wisdom without being prescriptive. 2-3 paragraphs.]

---

## Epilogue

[Closing reflection - Return to the opening image or idea, transformed. Leave the reader with something to carry forward. 1-2 paragraphs.]

---

*[Author signature or closing mark]*

---

**Word Count:** ~800 words  
**Tone:** Contemplative, lyrical, insightful`
  };

  return prompts[type] || prompts.document;
};

export const CreativeSynthesis = ({ isOpen, onClose, onInsertToChat }: CreativeSynthesisProps) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [outputs, setOutputs] = useState<CreativeOutput[]>([]);
  const [selectedOutputs, setSelectedOutputs] = useState<string[]>(["poem", "code", "image"]);
  const [completedCount, setCompletedCount] = useState(0);

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

  // Generate a single output (for parallel processing)
  const generateSingleOutput = async (
    outputType: string, 
    theme: string, 
    session: any
  ): Promise<CreativeOutput> => {
    // Handle image generation separately with actual image generation
    if (outputType === "image") {
      const imageResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          generateImage: true,
          imagePrompt: `Create a stunning, artistic image that captures: ${theme}. 
                        Style: Evocative, dreamlike, rich colors, professional quality.
                        Make it emotionally resonant and visually striking.`,
          messages: [],
          personality: "creative"
        })
      });

      if (!imageResp.ok) {
        throw new Error("Image generation failed");
      }

      const imageData = await imageResp.json();
      return {
        type: "image",
        content: imageData.content || "Image generated successfully",
        imageUrl: imageData.imageUrl
      };
    }

    // Text-based outputs
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: getPrompt(outputType, theme) }],
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

    return {
      type: outputType as CreativeOutput["type"],
      content
    };
  };

  const generateCreativeOutputs = async () => {
    if (!theme.trim()) return;

    setIsGenerating(true);
    setOutputs([]);
    setCurrentStep(0);
    setCompletedCount(0);

    // Initialize placeholder outputs
    const placeholders: CreativeOutput[] = selectedOutputs.map(type => ({
      type: type as CreativeOutput["type"],
      content: "",
      isGenerating: true
    }));
    setOutputs(placeholders);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Run all generations in parallel
      const promises = selectedOutputs.map(async (outputType, index) => {
        try {
          const result = await generateSingleOutput(outputType, theme, session);
          
          // Update the specific output as it completes
          setOutputs(prev => prev.map((o, i) => 
            i === index ? { ...result, isGenerating: false } : o
          ));
          setCompletedCount(prev => prev + 1);
          
          return result;
        } catch (error) {
          console.error(`Error generating ${outputType}:`, error);
          setOutputs(prev => prev.map((o, i) => 
            i === index ? { 
              type: outputType as CreativeOutput["type"], 
              content: `Failed to generate ${outputType}. Please try again.`,
              isGenerating: false 
            } : o
          ));
          setCompletedCount(prev => prev + 1);
          return null;
        }
      });

      await Promise.all(promises);

      toast({ title: "✨ Creative synthesis complete!", description: "All outputs generated in parallel" });

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
    toast({ title: "📋 Copied to clipboard" });
  };

  // Export all outputs as markdown
  const exportAsMarkdown = () => {
    const markdown = outputs.map(output => {
      const typeLabels: Record<string, string> = {
        poem: "📜 Poetry",
        code: "💻 Code Art",
        image: "🖼️ Visual Art",
        visualization: "📊 Data Visualization",
        music: "🎼 Musical Composition",
        document: "📝 Creative Essay"
      };
      
      let section = `\n\n---\n\n## ${typeLabels[output.type] || output.type}\n\n`;
      section += output.content;
      if (output.imageUrl) {
        section += `\n\n![Generated Image](${output.imageUrl})`;
      }
      return section;
    }).join('');

    const fullDoc = `# Creative Synthesis\n\n**Theme:** ${theme}\n\n**Generated:** ${new Date().toLocaleString()}${markdown}`;
    
    const blob = new Blob([fullDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creative-synthesis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "📥 Exported as Markdown" });
  };

  // Render professional output content
  const renderOutputContent = (output: CreativeOutput) => {
    if (output.isGenerating) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Generating {output.type}...</span>
        </div>
      );
    }

    // Image with actual generated image
    if (output.type === "image") {
      return (
        <div className="space-y-4">
          {output.imageUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img 
                src={output.imageUrl} 
                alt={theme}
                className="w-full h-auto max-h-[500px] object-contain bg-muted/20"
              />
              <a 
                href={output.imageUrl} 
                download={`creative-synthesis-${Date.now()}.png`}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm hover:bg-background transition-colors flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          ) : null}
          {output.content && (
            <p className="text-sm text-muted-foreground italic">{output.content}</p>
          )}
        </div>
      );
    }

    // Code blocks with syntax highlighting style
    if (output.type === "code" || output.type === "visualization") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {output.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Music with table rendering
    if (output.type === "music") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-table:border prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 prose-td:border">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {output.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Poem with elegant styling
    if (output.type === "poem") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-center prose-hr:my-4 prose-p:leading-relaxed prose-em:text-muted-foreground font-serif">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {output.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Document with professional layout
    if (output.type === "document") {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:border-b prose-headings:pb-2 prose-h1:text-2xl prose-h2:text-lg prose-blockquote:border-l-primary">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {output.content}
          </ReactMarkdown>
        </div>
      );
    }

    // Default rendering
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {output.content}
        </ReactMarkdown>
      </div>
    );
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
                Synthesizing... ({completedCount}/{selectedOutputs.length})
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
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Theme
                    </Badge>
                    {outputs.map((output, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge 
                          variant={output.isGenerating ? "outline" : "secondary"} 
                          className={`py-1 ${output.isGenerating ? 'animate-pulse' : ''}`}
                        >
                          {output.isGenerating ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            getOutputIcon(output.type)
                          )}
                          <span className="ml-1 capitalize">{output.type}</span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  {/* Export button */}
                  {outputs.some(o => !o.isGenerating && o.content) && (
                    <Button variant="outline" size="sm" onClick={exportAsMarkdown}>
                      <Download className="h-4 w-4 mr-2" />
                      Export All
                    </Button>
                  )}
                </div>

                {/* Output Cards */}
                <div className="grid gap-6">
                  {outputs.map((output, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={output.isGenerating ? 'border-primary/50' : ''}>
                        <CardHeader className="pb-3 border-b border-border/50">
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                output.type === 'poem' ? 'bg-pink-500/10' :
                                output.type === 'code' ? 'bg-blue-500/10' :
                                output.type === 'image' ? 'bg-green-500/10' :
                                output.type === 'visualization' ? 'bg-purple-500/10' :
                                output.type === 'music' ? 'bg-amber-500/10' :
                                'bg-cyan-500/10'
                              }`}>
                                {getOutputIcon(output.type)}
                              </div>
                              <div>
                                <span className="capitalize font-semibold">{output.type}</span>
                                <p className="text-xs text-muted-foreground font-normal">
                                  {output.type === 'poem' && 'Literary Poetry'}
                                  {output.type === 'code' && 'Generative Art (p5.js)'}
                                  {output.type === 'image' && 'AI Generated Visual'}
                                  {output.type === 'visualization' && 'Data Visualization (Python)'}
                                  {output.type === 'music' && 'Musical Score'}
                                  {output.type === 'document' && 'Creative Essay'}
                                </p>
                              </div>
                            </span>
                            {!output.isGenerating && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(output.content)}
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onInsertToChat(output.content)}
                                  title="Insert to chat"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {renderOutputContent(output)}
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
