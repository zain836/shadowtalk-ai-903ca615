import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, PhoneOff, Wrench, Brain, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useVoiceCopilot } from "@/hooks/useVoiceCopilot";

interface LiveVoiceCopilotProps {
  onClose?: () => void;
}

export const LiveVoiceCopilot = ({ onClose }: LiveVoiceCopilotProps) => {
  const [showHistory, setShowHistory] = useState(false);

  const {
    isProcessing,
    isListening,
    isSpeaking,
    lastTranscript,
    conversationHistory,
    startListening,
    stopListening,
    stopSpeaking,
    clearHistory,
  } = useVoiceCopilot({
    autoSpeak: true,
    onToolExecution: (tools) => {
      console.log("[VoiceCopilot] Tools executed:", tools);
    },
  });

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const statusText = isProcessing
    ? "Processing..."
    : isListening
    ? "Listening..."
    : isSpeaking
    ? "Speaking..."
    : "Tap to speak";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="flex flex-col items-center gap-6 p-8 max-w-lg w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Brain className="h-4 w-4 text-primary" />
          <span className="font-medium">Live Voice Copilot</span>
          <Badge variant="secondary" className="text-xs">Sprint 2</Badge>
        </div>

        {/* Main mic button */}
        <div className="relative">
          {isListening && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/30"
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-primary/20"
              />
            </>
          )}

          <button
            onClick={handleMicToggle}
            disabled={isProcessing}
            className={cn(
              "relative w-28 h-28 rounded-full flex items-center justify-center transition-all",
              isListening
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-muted hover:bg-muted/80",
              isProcessing && "opacity-50"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isListening ? (
              <Mic className="h-10 w-10" />
            ) : (
              <MicOff className="h-10 w-10" />
            )}
          </button>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-lg font-medium">{statusText}</p>
          {lastTranscript && (
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              "{lastTranscript}"
            </p>
          )}
        </div>

        {/* Tool executions indicator */}
        {conversationHistory.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {conversationHistory
              .filter(m => m.toolsExecuted?.length)
              .slice(-3)
              .flatMap(m => m.toolsExecuted || [])
              .map((tool, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-xs">
                  <Wrench className="h-3 w-3" />
                  {tool.name}
                </Badge>
              ))}
          </div>
        )}

        {/* Conversation history toggle */}
        <AnimatePresence>
          {showHistory && conversationHistory.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden"
            >
              <ScrollArea className="h-48 w-full rounded-lg border bg-muted/30 p-3">
                {conversationHistory.map((msg, i) => (
                  <div key={i} className={cn(
                    "mb-2 text-sm",
                    msg.role === "user" ? "text-right" : "text-left"
                  )}>
                    <span className={cn(
                      "inline-block px-3 py-1.5 rounded-lg max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {msg.content}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1"
          >
            {showHistory ? "Hide" : "History"} ({conversationHistory.length})
          </Button>

          {isSpeaking && (
            <Button variant="outline" size="sm" onClick={stopSpeaking}>
              Stop Speaking
            </Button>
          )}

          <Button variant="destructive" size="sm" onClick={onClose} className="gap-1">
            <PhoneOff className="h-4 w-4" />
            End
          </Button>
        </div>
      </motion.div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted"
      >
        <X className="h-5 w-5" />
      </button>
    </motion.div>
  );
};
