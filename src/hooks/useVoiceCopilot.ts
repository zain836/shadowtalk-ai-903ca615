import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceCopilotMessage {
  role: "user" | "assistant";
  content: string;
  toolsExecuted?: Array<{ name: string; result: string }>;
  timestamp: number;
}

interface UseVoiceCopilotOptions {
  onResponse?: (response: string) => void;
  onToolExecution?: (tools: Array<{ name: string; result: string }>) => void;
  autoSpeak?: boolean;
}

export const useVoiceCopilot = (options: UseVoiceCopilotOptions = {}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState<VoiceCopilotMessage[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const processTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    setLastTranscript(transcript);

    // Add user message to history
    const userMsg: VoiceCopilotMessage = { role: "user", content: transcript, timestamp: Date.now() };
    setConversationHistory(prev => [...prev, userMsg]);

    try {
      const { data, error } = await supabase.functions.invoke("voice-copilot", {
        body: {
          transcript,
          conversationHistory: conversationHistory.slice(-6).map(m => ({
            role: m.role, content: m.content,
          })),
          mode: "auto",
        },
      });

      if (error) throw error;

      const assistantMsg: VoiceCopilotMessage = {
        role: "assistant",
        content: data.response,
        toolsExecuted: data.tools_executed,
        timestamp: Date.now(),
      };
      setConversationHistory(prev => [...prev, assistantMsg]);

      options.onResponse?.(data.response);
      if (data.tools_executed?.length) {
        options.onToolExecution?.(data.tools_executed);
      }

      // Auto-speak response
      if (options.autoSpeak !== false && "speechSynthesis" in window) {
        speak(data.response);
      }

    } catch (err) {
      console.error("[VoiceCopilot] Error:", err);
      toast({
        title: "Voice Copilot Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [conversationHistory, options, toast]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Speech recognition unavailable.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript;
        processTranscript(transcript);
      } else {
        setLastTranscript(lastResult[0].transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("[VoiceCopilot] Recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastTranscript("");
  }, []);

  return {
    isProcessing,
    isListening,
    isSpeaking,
    lastTranscript,
    conversationHistory,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    processTranscript,
    clearHistory,
  };
};
