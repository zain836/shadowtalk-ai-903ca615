import { useCallback, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useChatSpeech() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  /** Dictation: fills the chat input from the microphone */
  const startDictation = useCallback(
    (onTranscript: (text: string) => void) => {
      const SpeechRecognitionCtor =
        window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        toast({
          title: "Microphone unavailable",
          description: "Speech recognition is not supported in this browser.",
          variant: "destructive",
        });
        return;
      }

      stopListening();
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const last = results[results.length - 1];
        const text = last[0]?.transcript?.trim();
        if (text && last.isFinal) onTranscript(text);
      };

      recognitionRef.current = recognition;
      recognition.start();
    },
    [stopListening, toast]
  );

  const toggleDictation = useCallback(
    (onTranscript: (text: string) => void) => {
      if (isListening) {
        stopListening();
        return;
      }
      startDictation(onTranscript);
    },
    [isListening, startDictation, stopListening]
  );

  const speakMessage = useCallback(
    (text: string, messageId: string) => {
      if (!("speechSynthesis" in window)) {
        toast({ title: "Text-to-speech unavailable", variant: "destructive" });
        return;
      }

      window.speechSynthesis.cancel();
      const plain = text.replace(/[#*_`[\]]/g, "").slice(0, 4000);
      const utterance = new SpeechSynthesisUtterance(plain);
      utterance.rate = 1;
      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMessageId(messageId);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      };
      window.speechSynthesis.speak(utterance);
    },
    [toast]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setSpeakingMessageId(null);
  }, []);

  return {
    isListening,
    isSpeaking,
    speakingMessageId,
    toggleDictation,
    stopListening,
    speakMessage,
    stopSpeaking,
  };
}
