import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Shield, Terminal, AlertTriangle, X, Send, Loader2, ChevronRight, Crosshair, Eye, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getModePrompt } from "@/components/chat/ModeSelector";
import { stringifyChatBody } from "@/lib/chatRequest";

type Phase = "intro" | "disclaimer" | "arena";
type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ARENA_PROMPTS = [
  { icon: Eye, label: "Recon a target with nmap + amass" },
  { icon: Crosshair, label: "Walk me through SQLi → RCE chain" },
  { icon: Shield, label: "Build a Sigma rule for lateral movement" },
  { icon: Swords, label: "Red vs Blue: AD attack & detection" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UncensoredArena({ open, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [agreed, setAgreed] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setPhase("intro");
      setAgreed(false);
      setMessages([]);
      const t = setTimeout(() => setPhase("disclaimer"), 2800);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    let assistant = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: stringifyChatBody({
          messages: next,
          personality: "friendly",
          mode: "uncensored",
          modePrompt: getModePrompt("uncensored"),
        }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limited — wait a moment");
        else if (resp.status === 402) toast.error("AI credits exhausted");
        else toast.error("Arena connection failed");
        setStreaming(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages([...next, { role: "assistant", content: assistant }]);
            }
          } catch { /* partial */ }
        }
      }
      if (!assistant) {
        setMessages([...next, { role: "assistant", content: "_No response. Try again._" }]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Arena connection error");
    }
    setStreaming(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Cyber grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239,68,68,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-black to-purple-950/30" />

      <AnimatePresence mode="wait">
        {/* Phase 1: cyber-entry animation */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full flex items-center justify-center"
          >
            {/* Scanlines */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ backgroundPosition: ["0 0", "0 100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(239,68,68,0.08) 0, rgba(239,68,68,0.08) 1px, transparent 1px, transparent 4px)",
              }}
            />
            <div className="text-center space-y-6 px-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 12 }}
                className="mx-auto w-32 h-32 rounded-full border-2 border-red-500/60 flex items-center justify-center bg-red-950/40 shadow-[0_0_80px_rgba(239,68,68,0.6)]"
              >
                <Skull className="w-16 h-16 text-red-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <div className="text-xs tracking-[0.4em] text-red-400/70 font-mono">
                  ESTABLISHING SECURE CHANNEL
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-red-100 font-mono">
                  ENTERING ARENA
                </h1>
                <motion.div
                  className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto"
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ delay: 0.6, duration: 1.5 }}
                />
                <div className="text-xs text-red-400/60 font-mono mt-4 space-y-1">
                  <div>{">"} bypass.firewall ........ OK</div>
                  <div>{">"} mount.shadow_kernel ... OK</div>
                  <div>{">"} init.uncensored_mode .. OK</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Phase 2: disclaimer */}
        {phase === "disclaimer" && (
          <motion.div
            key="disclaimer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full flex items-center justify-center p-6"
          >
            <div className="max-w-2xl w-full bg-black/80 backdrop-blur-xl border border-red-500/40 rounded-2xl p-8 shadow-[0_0_60px_rgba(239,68,68,0.3)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-100 font-mono">UNCENSORED ARENA — TERMS</h2>
                  <p className="text-sm text-red-300/70 mt-1">Read carefully before entering.</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-red-100/90 font-mono leading-relaxed max-h-[40vh] overflow-y-auto pr-2">
                <p>
                  This mode provides hands-on instruction in <strong>ethical hacking, penetration testing,
                  red teaming, and blue teaming</strong> — both practical and theoretical. The assistant will
                  provide real commands, payloads, exploit chains, detection rules, and post-exploitation
                  techniques.
                </p>
                <p className="text-red-200">
                  ⚠️ <strong>You agree that:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-red-100/80">
                  <li>You will only target systems you own or have written authorization to test.</li>
                  <li>You are solely responsible for how you use any information provided.</li>
                  <li>
                    <strong className="text-red-300">ShadowTalk is NOT responsible</strong> for any damage,
                    loss, legal consequence, or harm caused by misuse of this feature.
                  </li>
                  <li>You will not use these techniques against critical infrastructure, individuals, or
                    third parties without explicit lawful authorization.</li>
                  <li>All session content stays subject to our Terms of Service and Privacy Policy.</li>
                </ul>
                <p className="text-red-300/80 italic">
                  Misuse may violate computer-fraud laws (CFAA, Computer Misuse Act, GDPR Art. 32, etc.).
                  Stay legal. Stay ethical.
                </p>
              </div>

              <label className="flex items-start gap-3 mt-6 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-500"
                />
                <span className="text-sm text-red-100/90">
                  I have read, understood, and accept full responsibility. I will only use this knowledge
                  ethically and lawfully.
                </span>
              </label>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-red-500/30 text-red-200 hover:bg-red-950/30"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                  disabled={!agreed}
                  onClick={() => setPhase("arena")}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-40"
                >
                  Enter the Arena <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 3: Arena chat */}
        {phase === "arena" && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-red-500/30 bg-black/60 backdrop-blur-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Skull className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="font-mono font-bold text-red-100 text-sm tracking-wider">UNCENSORED ARENA</div>
                  <div className="text-[10px] text-red-300/60 font-mono flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE · ETHICAL HACKING TRAINING
                  </div>
                </div>
                <Badge variant="outline" className="border-red-500/40 text-red-300 text-[10px] font-mono">
                  AUTHORIZED USE ONLY
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-red-300 hover:bg-red-950/40">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1" ref={scrollRef as any}>
              <div className="max-w-3xl mx-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="inline-block p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-4">
                      <Terminal className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-100 font-mono mb-2">
                      Welcome, operator.
                    </h3>
                    <p className="text-sm text-red-300/70 max-w-md mx-auto mb-6">
                      Ask anything about offensive security, defensive operations, or red/blue methodology.
                      Real commands. Real payloads. Real defenses.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                      {ARENA_PROMPTS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => send(p.label)}
                          className="p-3 rounded-xl border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/50 text-left text-xs text-red-100/90 transition flex items-center gap-2"
                        >
                          <p.icon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3", m.role === "user" && "justify-end")}
                    >
                      {m.role === "assistant" && (
                        <div className="shrink-0 mt-1 p-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
                          <Terminal className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-xl px-4 py-3 max-w-[85%] text-sm",
                          m.role === "user"
                            ? "bg-red-600 text-white"
                            : "bg-black/60 border border-red-500/20 text-red-50"
                        )}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&_pre]:bg-black/80 [&_pre]:border [&_pre]:border-red-500/20 [&_pre]:rounded-md [&_code]:text-xs [&_code]:font-mono [&_a]:text-red-300">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                {streaming && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 shrink-0 mt-1">
                      <Terminal className="w-4 h-4 text-red-400 animate-pulse" />
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-black/60 border border-red-500/20">
                      <Loader2 className="w-4 h-4 animate-spin text-red-300" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-red-500/30 bg-black/60 backdrop-blur-xl p-3">
              <div className="max-w-3xl mx-auto flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input.trim());
                    }
                  }}
                  placeholder="Ask the arena... (e.g., 'show me a working SSRF payload to bypass localhost filters')"
                  rows={1}
                  className="min-h-[44px] max-h-[140px] resize-none text-sm bg-black/60 border-red-500/30 text-red-50 placeholder:text-red-300/40 focus-visible:ring-red-500/40"
                />
                <Button
                  onClick={() => send(input.trim())}
                  disabled={!input.trim() || streaming}
                  className="h-11 w-11 shrink-0 bg-red-600 hover:bg-red-500"
                  size="icon"
                >
                  {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-red-400/50 font-mono text-center mt-2">
                Authorized targets only · ShadowTalk is not liable for misuse · Stay legal.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
