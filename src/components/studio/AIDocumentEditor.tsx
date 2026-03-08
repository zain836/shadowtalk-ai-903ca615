import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Wand2, RefreshCw, AlignLeft, Languages, CheckCheck,
  MessageSquare, ListOrdered, Loader2, Copy, Download, Undo2,
  Sparkles, ArrowRight, Type, Minimize2
} from "lucide-react";

const AI_ACTIONS = [
  { id: "rewrite", label: "Rewrite", icon: RefreshCw, description: "Clearer & professional" },
  { id: "summarize", label: "Summarize", icon: Minimize2, description: "Concise summary" },
  { id: "expand", label: "Expand", icon: AlignLeft, description: "Add more detail" },
  { id: "fix_grammar", label: "Fix Grammar", icon: CheckCheck, description: "Correct errors" },
  { id: "make_formal", label: "Formal Tone", icon: Type, description: "Professional voice" },
  { id: "make_casual", label: "Casual Tone", icon: MessageSquare, description: "Conversational" },
  { id: "bullet_points", label: "Bullet Points", icon: ListOrdered, description: "Structured list" },
  { id: "translate", label: "Translate", icon: Languages, description: "Any language" },
];

const LANGUAGES = [
  "Spanish", "French", "German", "Chinese", "Japanese", "Korean",
  "Arabic", "Hindi", "Portuguese", "Russian", "Italian", "Urdu",
];

export const AIDocumentEditor: React.FC = () => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("Spanish");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showDiff, setShowDiff] = useState(false);

  const updateContent = useCallback((text: string) => {
    setContent(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  }, []);

  const processDocument = useCallback(async (action: string) => {
    if (!content.trim()) {
      toast({ title: "Enter some text first", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setActiveAction(action);

    try {
      // Save current state
      setHistory(prev => [...prev, content]);
      setOriginalContent(content);

      const { data, error } = await supabase.functions.invoke("document-ai", {
        body: {
          action,
          content: content.trim(),
          instruction: customInstruction.trim() || undefined,
          language: action === "translate" ? selectedLanguage : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.result) {
        updateContent(data.result);
        setShowDiff(true);
        toast({ title: `✨ ${AI_ACTIONS.find(a => a.id === action)?.label || "Custom"} applied!` });
      }
    } catch (err: any) {
      toast({ title: "Processing failed", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  }, [content, customInstruction, selectedLanguage, toast, updateContent]);

  const handleUndo = () => {
    if (history.length > 0) {
      updateContent(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
      setShowDiff(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Editor */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Editor
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{wordCount} words</span>
                  <span>·</span>
                  <span>{charCount} chars</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!content} title="Copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!content} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleUndo} title="Undo">
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste or type your document here... The AI will help you transform it."
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              rows={20}
              maxLength={50000}
              className="resize-none font-mono text-sm min-h-[400px]"
            />
          </CardContent>
        </Card>

        {/* Diff View */}
        <AnimatePresence>
          {showDiff && originalContent && originalContent !== content && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-muted-foreground">Previous Version</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowDiff(false)}>
                      Hide
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded max-h-[200px] overflow-auto whitespace-pre-wrap font-mono">
                    {originalContent}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Toolbar */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> AI Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {AI_ACTIONS.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                disabled={isProcessing || !content.trim()}
                onClick={() => processDocument(action.id)}
                className="w-full justify-start gap-2 h-auto py-2.5"
              >
                {activeAction === action.id ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <action.icon className="h-4 w-4 shrink-0" />
                )}
                <div className="text-left">
                  <div className="font-medium text-xs">{action.label}</div>
                  <div className="text-[10px] text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Translate Language Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Languages className="h-4 w-4" /> Translation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="secondary"
              disabled={isProcessing || !content.trim()}
              onClick={() => processDocument("translate")}
              className="w-full gap-2"
            >
              {activeAction === "translate" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Translate to {selectedLanguage}
            </Button>
          </CardContent>
        </Card>

        {/* Custom AI Instruction */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Custom Instruction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="e.g. Make it sound like a TED talk, add humor, convert to email format..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none text-sm"
            />
            <Button
              size="sm"
              disabled={isProcessing || !content.trim() || !customInstruction.trim()}
              onClick={() => processDocument("custom")}
              className="w-full gap-2"
            >
              {activeAction === "custom" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              Apply Custom Edit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIDocumentEditor;
