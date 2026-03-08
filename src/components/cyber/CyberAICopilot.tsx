import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Send, Crosshair, Shield, FileText, Eye, Loader2,
  Sparkles, Terminal, AlertTriangle, BookOpen, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

const modes = [
  { id: "general", label: "General", icon: Brain, color: "text-primary" },
  { id: "recon", label: "Recon", icon: Eye, color: "text-blue-400" },
  { id: "exploit", label: "Exploit", icon: Crosshair, color: "text-destructive" },
  { id: "incident", label: "IR", icon: Shield, color: "text-warning" },
  { id: "report", label: "Report", icon: FileText, color: "text-secondary" },
];

const quickPrompts = [
  "Analyze CVE-2026-0217 and suggest exploitation paths",
  "Generate a recon workflow for target.com",
  "Create a professional pentest report template",
  "Map this attack to MITRE ATT&CK: phishing → macro → powershell → mimikatz",
  "Suggest SQLi payloads for a login form with WAF bypass",
  "How to detect lateral movement in Windows event logs",
  "Generate a bug bounty report for an IDOR vulnerability",
  "Explain privilege escalation via sudo misconfigurations",
];

const CYBER_AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cyber-ai-copilot`;

export default function CyberAICopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const userMsg: Message = { role: "user", content: userMessage };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CYBER_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, mode }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limited — wait a moment");
        else if (resp.status === 402) toast.error("AI credits exhausted");
        else toast.error("Failed to connect to Cyber AI");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages([...allMessages, { role: "assistant", content: assistantContent }]);
            }
          } catch { /* partial */ }
        }
      }

      if (!assistantContent) {
        setMessages([...allMessages, { role: "assistant", content: "I couldn't generate a response. Please try again." }]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error");
      setMessages([...allMessages, { role: "assistant", content: "Connection error. Please try again." }]);
    }
    setIsStreaming(false);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    streamChat(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {modes.map(m => (
          <Button
            key={m.id}
            size="sm"
            variant={mode === m.id ? "default" : "outline"}
            className={cn("gap-1.5 text-xs h-8", mode === m.id && "shadow-md")}
            onClick={() => setMode(m.id)}
          >
            <m.icon className={cn("h-3.5 w-3.5", mode === m.id ? "" : m.color)} />
            {m.label}
          </Button>
        ))}
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-muted-foreground ml-auto" onClick={() => setMessages([])}>
            <Trash2 className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]" ref={scrollRef as any}>
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto mb-4">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Cyber AI Copilot</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Your AI-powered security assistant. Ask about vulnerabilities, generate payloads, analyze incidents, or write reports.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                    {quickPrompts.slice(0, 4).map((p, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-xl border border-border text-left text-xs text-muted-foreground hover:bg-muted/50 hover:border-primary/30 transition-colors"
                        onClick={() => streamChat(p)}
                      >
                        <Sparkles className="h-3 w-3 text-primary mb-1" />
                        {p}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "")}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 mt-1">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Terminal className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-4 py-3 max-w-[85%] text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 border border-border"
                    )}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-background/80 [&_pre]:border [&_pre]:border-border [&_pre]:rounded-lg [&_pre]:p-3 [&_code]:text-xs [&_code]:font-mono [&_table]:text-xs">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {isStreaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-1">
                    <Terminal className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted/50 border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask the Cyber Copilot (${modes.find(m => m.id === mode)?.label} mode)...`}
                className="min-h-[44px] max-h-[120px] resize-none text-sm bg-muted/30 border-border"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
