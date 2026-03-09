import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useRobustOfflineAI } from "@/hooks/useRobustOfflineAI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Cpu, Download, Wifi, WifiOff, Zap, Brain, Send, Loader2,
  Settings2, Trash2, CheckCircle2, HardDrive, Activity,
  Sparkles, Terminal, Shield, ArrowLeft, ChevronRight,
  Lock, AlertCircle, Gauge
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; ts: number };

const MODEL_META: Record<string, { desc: string; best_for: string[] }> = {
  "Llama-3.2-3B-Instruct-q4f16_1-MLC": {
    desc: "Meta's flagship small model. Best balance of speed and quality.",
    best_for: ["Code", "Reasoning", "Math", "Chat"],
  },
  "Llama-3.2-1B-Instruct-q4f16_1-MLC": {
    desc: "Ultra-fast lightweight model for quick responses.",
    best_for: ["Chat", "Summaries", "Q&A"],
  },
  "Qwen2.5-1.5B-Instruct-q4f16_1-MLC": {
    desc: "Alibaba's multilingual model. Strong at reasoning.",
    best_for: ["Multilingual", "Reasoning", "Math"],
  },
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC": {
    desc: "Smallest model. Instant responses, minimal RAM.",
    best_for: ["Chat", "Basic tasks"],
  },
};

const QUICK_STARTERS = [
  "Explain quantum entanglement in simple terms",
  "Write a Python function to scrape a website",
  "What are the best practices for password security?",
  "Summarize the key concepts of machine learning",
  "Help me debug this React component error",
  "Create a regex to validate email addresses",
];

export default function PersonalLLMPage() {
  const navigate = useNavigate();
  const ai = useRobustOfflineAI();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a personal AI assistant running entirely on this device. You are helpful, precise, and concise."
  );
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"models" | "chat">("models");
  const [tokensPerSec, setTokensPerSec] = useState<number | null>(null);
  const [totalTokens, setTotalTokens] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const genStartRef = useRef<number>(0);
  const tokenCountRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Switch to chat tab once model is ready
  useEffect(() => {
    if (ai.isReady && activeTab === "models") {
      setActiveTab("chat");
    }
  }, [ai.isReady]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;

    const userMsg: Message = { role: "user", content: text.trim(), ts: Date.now() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsGenerating(true);
    setTokensPerSec(null);
    tokenCountRef.current = 0;
    genStartRef.current = Date.now();

    const history = allMessages.slice(-12).map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const contextMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history,
    ];

    let assistantContent = "";
    const assistantTs = Date.now();

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: "", ts: assistantTs },
    ]);

    try {
      await ai.generateResponse(contextMessages, (chunk: string) => {
        assistantContent += chunk;
        tokenCountRef.current += chunk.split(/\s+/).length;

        const elapsed = (Date.now() - genStartRef.current) / 1000;
        if (elapsed > 0.5) {
          setTokensPerSec(Math.round(tokenCountRef.current / elapsed));
        }

        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant") {
            updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
          }
          return updated;
        });
      });

      setTotalTokens(prev => prev + tokenCountRef.current);
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: "⚠️ An error occurred. Please try again.",
          };
        }
        return updated;
      });
    }

    setIsGenerating(false);
  }, [messages, isGenerating, systemPrompt, ai]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const storagePercent = ai.storageEstimate
    ? Math.round((ai.storageEstimate.used / ai.storageEstimate.quota) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 pt-20 pb-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate("/chatbot")}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Personal LLM</h1>
                <p className="text-xs text-muted-foreground">100% on-device · WebGPU · Zero cloud</p>
              </div>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2">
            {ai.hasWebGPU ? (
              <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary bg-primary/5">
                <Zap className="h-3 w-3" /> GPU Accelerated
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 text-xs border-muted-foreground/30 text-muted-foreground">
                <Cpu className="h-3 w-3" /> CPU Mode
              </Badge>
            )}
            <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary bg-primary/5">
              <Lock className="h-3 w-3" /> Air-Gapped
            </Badge>
            {ai.isReady && (
              <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary bg-primary/5">
                <CheckCircle2 className="h-3 w-3" /> {ai.activeModel} Ready
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 p-1 bg-muted/30 rounded-xl w-fit border border-border">
          {(["models", "chat"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "models" ? "🤖 Models" : "💬 Chat"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── MODELS TAB ─── */}
          {activeTab === "models" && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5"
            >
              {/* Model cards */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  Available Models
                </h2>
                {ai.models.map(model => {
                  const meta = MODEL_META[model.id];
                  const isActive = ai.activeModel === model.name;
                  const isLoading = ai.isLoading && !ai.isReady;

                  return (
                    <motion.div
                      key={model.id}
                      layout
                      className={cn(
                        "relative rounded-2xl border p-5 transition-all cursor-pointer group",
                        isActive
                          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      {/* Active pulse */}
                      {isActive && (
                        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground">{model.name}</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary"
                            >
                              {model.size}
                            </Badge>
                            {model.tier === "premium" && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
                                ★ Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{meta?.desc}</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {meta?.best_for.map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {ai.formatBytes(model.bytes)}
                            </span>
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="shrink-0">
                          {isActive ? (
                            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary bg-primary/10">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Loaded
                            </Button>
                          ) : ai.isLoading && ai.loadStage.includes(model.name) ? (
                            <div className="space-y-1.5 min-w-[120px]">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {ai.loadProgress}%
                              </div>
                              <Progress value={ai.loadProgress} className="h-1.5 w-[120px]" />
                              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{ai.loadStage}</p>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs gap-1.5 hover:border-primary/50 hover:text-primary"
                              onClick={() => {
                                ai.downloadModel(model.id);
                                setActiveTab("models");
                              }}
                              disabled={ai.isLoading}
                            >
                              <Download className="h-3.5 w-3.5" /> Load
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Download progress bar */}
                      {ai.isLoading && ai.loadStage.includes(model.name) && (
                        <div className="mt-3">
                          <Progress value={ai.loadProgress} className="h-1" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Background download indicator */}
                {ai.isBackgroundDownloading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl border border-border bg-muted/20 px-4 py-3 flex items-center gap-3 text-xs text-muted-foreground"
                  >
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    <span>Preparing {ai.recommendedModel.name} in background... {ai.backgroundProgress}%</span>
                    {ai.downloadSpeed && (
                      <span className="ml-auto text-primary font-mono">{ai.downloadSpeed}</span>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Sidebar: device info */}
              <div className="space-y-4">
                {/* Device capabilities */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Device Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> WebGPU
                      </span>
                      <span className={cn("text-xs font-medium", ai.hasWebGPU ? "text-primary" : "text-muted-foreground")}>
                        {ai.hasWebGPU ? "✓ Available" : "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5" /> Internet
                      </span>
                      <span className={cn("text-xs font-medium", navigator.onLine ? "text-primary" : "text-destructive")}>
                        {navigator.onLine ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" /> Privacy
                      </span>
                      <span className="text-xs font-medium text-primary">100% Local</span>
                    </div>
                    {ai.storageEstimate && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <HardDrive className="h-3.5 w-3.5" /> Storage
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {ai.formatBytes(ai.storageEstimate.used)} / {ai.formatBytes(ai.storageEstimate.quota)}
                          </span>
                        </div>
                        <Progress value={storagePercent} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">How It Works</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: Download, text: "Download model weights to your browser cache" },
                      { icon: Cpu, text: "WebGPU runs inference on your GPU/CPU" },
                      { icon: Lock, text: "Zero data leaves your device, ever" },
                      { icon: WifiOff, text: "Works completely offline once downloaded" },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex gap-2.5 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/60" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {ai.isReady && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => setActiveTab("chat")}
                  >
                    Start Chatting <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── CHAT TAB ─── */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-5"
            >
              {/* Chat panel */}
              <div className="lg:col-span-3 flex flex-col">
                {/* Stats bar */}
                {ai.isReady && (
                  <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted/30 border border-border mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                      {ai.activeModel}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      {ai.hasWebGPU ? "GPU" : "CPU"}
                    </span>
                    {tokensPerSec !== null && (
                      <span className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5" />
                        ~{tokensPerSec} tok/s
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      {totalTokens} tokens generated
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                        onClick={() => setShowSettings(s => !s)}
                      >
                        <Settings2 className="h-3 w-3" /> System Prompt
                      </Button>
                      {messages.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                          onClick={() => { setMessages([]); setTotalTokens(0); setTokensPerSec(null); }}
                        >
                          <Trash2 className="h-3 w-3" /> Clear
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* System prompt editor */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">System Prompt</label>
                        <Textarea
                          value={systemPrompt}
                          onChange={e => setSystemPrompt(e.target.value)}
                          className="text-xs min-h-[80px] resize-none bg-background/50 border-border"
                          rows={3}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Customize the AI's personality, instructions, and focus area.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat area */}
                <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden">
                  <ScrollArea className="h-[500px]" ref={scrollRef as any}>
                    <div className="p-4 space-y-4">
                      {!ai.isReady && !ai.isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                            <Brain className="h-10 w-10 text-muted-foreground/50" />
                          </div>
                          <h3 className="font-semibold text-foreground mb-1">No model loaded</h3>
                          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                            Go to the Models tab to download and load a model to your device.
                          </p>
                          <Button size="sm" onClick={() => setActiveTab("models")} className="gap-1.5">
                            <Download className="h-4 w-4" /> Browse Models
                          </Button>
                        </div>
                      )}

                      {ai.isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <div className="relative mb-5">
                            <div className="p-4 rounded-2xl bg-primary/10">
                              <Brain className="h-10 w-10 text-primary animate-pulse" />
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground mb-1">{ai.loadStage}</p>
                          <p className="text-xs text-muted-foreground mb-4">Hang tight — model loads once, then it's instant</p>
                          <div className="w-48">
                            <Progress value={ai.loadProgress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground text-right mt-1">{ai.loadProgress}%</p>
                          </div>
                        </div>
                      )}

                      {ai.isReady && messages.length === 0 && (
                        <div className="py-8">
                          <div className="text-center mb-6">
                            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-3">
                              <Brain className="h-7 w-7 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">
                              {ai.activeModel} is ready
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Running 100% on your device · No internet needed
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                            {QUICK_STARTERS.map((s, i) => (
                              <motion.button
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="p-3 rounded-xl border border-border text-left text-xs text-muted-foreground hover:bg-muted/50 hover:border-primary/30 hover:text-foreground transition-all"
                                onClick={() => sendMessage(s)}
                              >
                                <Sparkles className="h-3 w-3 text-primary mb-1" />
                                {s}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                        >
                          {msg.role === "assistant" && (
                            <div className="shrink-0 mt-1">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <Brain className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                          <div className={cn(
                            "rounded-2xl px-4 py-3 max-w-[85%] text-sm",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/40 border border-border"
                          )}>
                            {msg.role === "assistant" ? (
                              msg.content ? (
                                <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-background/80 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-xs [&_code]:font-mono [&_table]:text-xs">
                                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 py-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                              )
                            ) : (
                              msg.content
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="border-t border-border p-3">
                    {!ai.isReady && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        Load a model first to start chatting
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={ai.isReady ? `Message ${ai.activeModel || "Personal LLM"}...` : "Load a model to start chatting..."}
                        disabled={!ai.isReady || isGenerating}
                        className="min-h-[44px] max-h-[120px] resize-none text-sm bg-muted/30 border-border"
                        rows={1}
                      />
                      <Button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || !ai.isReady || isGenerating}
                        size="icon"
                        className="h-11 w-11 shrink-0"
                      >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                      Enter to send · Shift+Enter for new line · No data leaves your device
                    </p>
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">
                {/* Model status */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Model Status</h3>
                  {ai.isReady ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                        </span>
                        <span className="text-xs font-medium text-green-400">Active</span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{ai.activeModel}</p>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Acceleration</span>
                          <span>{ai.hasWebGPU ? "WebGPU" : "CPU"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Privacy</span>
                          <span className="text-primary">100% Local</span>
                        </div>
                        {tokensPerSec && (
                          <div className="flex justify-between">
                            <span>Speed</span>
                            <span>{tokensPerSec} tok/s</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Total generated</span>
                          <span>{totalTokens} tokens</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs gap-1.5 mt-1"
                        onClick={() => setActiveTab("models")}
                      >
                        Switch Model
                      </Button>
                    </div>
                  ) : ai.isLoading ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        {ai.loadStage}
                      </div>
                      <Progress value={ai.loadProgress} className="h-1.5" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">No model loaded</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs gap-1.5"
                        onClick={() => setActiveTab("models")}
                      >
                        <Download className="h-3.5 w-3.5" /> Browse Models
                      </Button>
                    </div>
                  )}
                </div>

                {/* Privacy guarantee */}
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-semibold">Privacy Guarantee</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <p>✓ Model runs on YOUR hardware</p>
                    <p>✓ Zero API calls to any server</p>
                    <p>✓ No conversation logging</p>
                    <p>✓ Air-gapped capable</p>
                    <p>✓ Fully open weights</p>
                  </div>
                </div>

                {/* Storage */}
                {ai.storageEstimate && (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground">Local Storage</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Used</span>
                        <span>{ai.formatBytes(ai.storageEstimate.used)}</span>
                      </div>
                      <Progress value={storagePercent} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        {ai.formatBytes(ai.storageEstimate.quota - ai.storageEstimate.used)} free of {ai.formatBytes(ai.storageEstimate.quota)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
