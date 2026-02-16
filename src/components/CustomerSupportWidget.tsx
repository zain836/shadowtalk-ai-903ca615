import { useState, useCallback, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useProactiveAI } from "@/hooks/useProactiveAI";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CustomerSupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your 24/7 AI support assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { currentMessage, isVisible, dismiss, recordInteraction } = useProactiveAI(isOpen);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // When user opens chat from a proactive message, inject it as context
  const openFromProactive = useCallback(() => {
    if (currentMessage) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: currentMessage.content }
      ]);
      dismiss();
      recordInteraction(currentMessage.content.slice(0, 50));
    }
    setIsOpen(true);
  }, [currentMessage, dismiss, recordInteraction]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    recordInteraction(userMessage.slice(0, 50));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              { 
                role: "system", 
                content: "You are a helpful 24/7 customer support assistant for ShadowTalk AI. Be friendly, concise, and helpful. Answer questions about features, pricing, and usage. Keep responses brief and to the point." 
              },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: userMessage }
            ]
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { role: "assistant", content: assistantContent };
                  return newMessages;
                });
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I'm having trouble connecting. Please try again in a moment." 
      }]);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to send message. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, toast, recordInteraction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40 hidden sm:flex flex-col items-end gap-3">
        {/* Proactive Message Bubble */}
        <AnimatePresence>
          {currentMessage && isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="max-w-xs cursor-pointer group"
              onClick={openFromProactive}
            >
              <div className="relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl rounded-br-md p-4 shadow-2xl">
                {/* Dismiss button */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(); }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
                
                {/* Sparkle indicator */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{currentMessage.content}</p>
                    <p className="text-xs text-primary mt-2 font-medium group-hover:underline">
                      Click to chat →
                    </p>
                  </div>
                </div>
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-2xl rounded-br-md border border-primary/20 animate-pulse pointer-events-none" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Chat Button */}
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105 relative"
          style={{
            boxShadow: '0 0 20px hsl(var(--primary) / 0.4), 0 4px 15px hsl(0 0% 0% / 0.3)'
          }}
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          
          {/* Notification dot when proactive message is active */}
          {currentMessage && isVisible && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center"
            >
              <Sparkles className="h-3 w-3 text-accent-foreground" />
            </motion.div>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-[500px]">
      <Card className="bg-card/95 backdrop-blur-lg border-border shadow-2xl overflow-hidden flex flex-col h-[70vh] sm:h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Proactive • Always thinking
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {message.content || (isLoading && i === messages.length - 1 ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : "")}
                </div>
                {message.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Powered by AI • Proactive • 24/7
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CustomerSupportWidget;
