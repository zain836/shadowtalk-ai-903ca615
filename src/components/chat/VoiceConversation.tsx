import { useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceConversationProps {
  isListening: boolean;
  isSpeaking: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
  lastTranscript?: string;
  isProcessing?: boolean;
}

export const VoiceConversation = ({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onSpeak,
  onStopSpeaking,
  lastTranscript = "",
  isProcessing = false,
}: VoiceConversationProps) => {
  const { toast } = useToast();
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const toggleVoiceMode = () => {
    if (!isVoiceMode) {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Not supported",
          description: "Voice mode is not supported in your browser.",
          variant: "destructive",
        });
        return;
      }
      setIsVoiceMode(true);
      onStartListening();
    } else {
      setIsVoiceMode(false);
      onStopListening();
      onStopSpeaking();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleSpeakerToggle = () => {
    if (isSpeaking) {
      onStopSpeaking();
    }
  };

  return (
    <>
      {/* Voice mode button */}
      <Button
        variant={isVoiceMode ? "default" : "ghost"}
        size="sm"
        onClick={toggleVoiceMode}
        className={cn(
          "gap-2 h-8 px-2 text-xs",
          isVoiceMode && "bg-primary text-primary-foreground"
        )}
      >
        {isVoiceMode ? (
          <>
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">End Voice</span>
          </>
        ) : (
          <>
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Voice Mode</span>
          </>
        )}
      </Button>

      {/* Voice mode overlay */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="flex flex-col items-center gap-8 p-8"
            >
              {/* Main indicator */}
              <div className="relative">
                {/* Pulse animation */}
                {isListening && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-primary/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="absolute inset-0 rounded-full bg-primary/20"
                    />
                  </>
                )}
                
                {/* Main button */}
                <button
                  onClick={handleMicToggle}
                  disabled={isProcessing}
                  className={cn(
                    "relative w-32 h-32 rounded-full flex items-center justify-center transition-all",
                    isListening
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted hover:bg-muted/80",
                    isProcessing && "opacity-50"
                  )}
                >
                  {isProcessing ? (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  ) : isListening ? (
                    <Mic className="h-12 w-12" />
                  ) : (
                    <MicOff className="h-12 w-12" />
                  )}
                </button>
              </div>

              {/* Status text */}
              <div className="text-center">
                <p className="text-lg font-medium">
                  {isProcessing
                    ? "Processing..."
                    : isListening
                    ? "Listening..."
                    : isSpeaking
                    ? "Speaking..."
                    : "Tap to speak"}
                </p>
                {lastTranscript && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    "{lastTranscript}"
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSpeakerToggle}
                  disabled={!isSpeaking}
                  className="gap-2"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="h-5 w-5" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5" />
                      Speaker
                    </>
                  )}
                </Button>
                
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={toggleVoiceMode}
                  className="gap-2"
                >
                  <PhoneOff className="h-5 w-5" />
                  End
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
