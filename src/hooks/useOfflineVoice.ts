import { useState, useCallback, useRef, useEffect } from 'react';

interface OfflineVoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
}

export const useOfflineVoice = () => {
  const [state, setState] = useState<OfflineVoiceState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    isSupported: false,
    error: null,
    voices: [],
    selectedVoice: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check browser support and initialize
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSupported = !!SpeechRecognitionClass;
    const ttsSupported = 'speechSynthesis' in window;

    if (speechSupported && SpeechRecognitionClass) {
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false; // Changed to false for better desktop support
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setState(prev => ({
          ...prev,
          transcript: finalTranscript || interimTranscript,
        }));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Handle 'not-allowed' and 'no-speech' gracefully
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setState(prev => ({
            ...prev,
            isListening: false,
            error: `Speech recognition error: ${event.error}`,
          }));
        }
      };

      recognitionRef.current.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };
    }

    if (ttsSupported) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setState(prev => ({
          ...prev,
          voices: availableVoices,
          selectedVoice: availableVoices.find(v => v.default) || availableVoices[0] || null,
        }));
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    setState(prev => ({
      ...prev,
      isSupported: speechSupported && ttsSupported,
    }));

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors on cleanup
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return;
    }

    setState(prev => ({ ...prev, transcript: '', error: null }));
    
    try {
      recognitionRef.current.start();
      setState(prev => ({ ...prev, isListening: true }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to start listening' 
      }));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors
      }
      setState(prev => ({ ...prev, isListening: false }));
    }
  }, []);

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    if (!synthRef.current) {
      setState(prev => ({ ...prev, error: 'Speech synthesis not supported' }));
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = state.selectedVoice;
    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    utterance.onerror = (event) => {
      setState(prev => ({
        ...prev,
        isSpeaking: false,
        error: `Speech error: ${event.error}`,
      }));
    };

    synthRef.current.speak(utterance);
  }, [state.selectedVoice]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setState(prev => ({ ...prev, selectedVoice: voice }));
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    setVoice,
    setLanguage,
  };
};
