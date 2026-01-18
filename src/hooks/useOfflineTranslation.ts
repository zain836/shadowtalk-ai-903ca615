import { useState, useCallback, useRef } from 'react';

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

interface OfflineTranslationState {
  isLoading: boolean;
  isTranslating: boolean;
  isSupported: boolean;
  loadProgress: number;
  error: string | null;
  history: TranslationResult[];
  availableLanguages: { code: string; name: string }[];
}

// Supported languages for the translation model
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

// Extended dictionary-based translation for offline fallback
const BASIC_TRANSLATIONS: Record<string, Record<string, Record<string, string>>> = {
  en: {
    es: { 
      hello: 'hola', goodbye: 'adiós', 'thank you': 'gracias', thanks: 'gracias',
      please: 'por favor', yes: 'sí', no: 'no', good: 'bueno', bad: 'malo',
      morning: 'mañana', night: 'noche', day: 'día', water: 'agua', food: 'comida',
      help: 'ayuda', love: 'amor', friend: 'amigo', family: 'familia', work: 'trabajo',
      home: 'casa', today: 'hoy', tomorrow: 'mañana', yesterday: 'ayer',
      'how are you': 'cómo estás', 'what is your name': 'cómo te llamas',
      'nice to meet you': 'mucho gusto', 'see you later': 'hasta luego',
    },
    fr: { 
      hello: 'bonjour', goodbye: 'au revoir', 'thank you': 'merci', thanks: 'merci',
      please: 's\'il vous plaît', yes: 'oui', no: 'non', good: 'bon', bad: 'mauvais',
      morning: 'matin', night: 'nuit', day: 'jour', water: 'eau', food: 'nourriture',
      help: 'aide', love: 'amour', friend: 'ami', family: 'famille', work: 'travail',
      home: 'maison', today: 'aujourd\'hui', tomorrow: 'demain', yesterday: 'hier',
      'how are you': 'comment allez-vous', 'what is your name': 'comment vous appelez-vous',
    },
    de: { 
      hello: 'hallo', goodbye: 'auf wiedersehen', 'thank you': 'danke', thanks: 'danke',
      please: 'bitte', yes: 'ja', no: 'nein', good: 'gut', bad: 'schlecht',
      morning: 'morgen', night: 'nacht', day: 'tag', water: 'wasser', food: 'essen',
      help: 'hilfe', love: 'liebe', friend: 'freund', family: 'familie', work: 'arbeit',
      home: 'zuhause', today: 'heute', tomorrow: 'morgen', yesterday: 'gestern',
    },
    it: {
      hello: 'ciao', goodbye: 'arrivederci', 'thank you': 'grazie', thanks: 'grazie',
      please: 'per favore', yes: 'sì', no: 'no', good: 'buono', bad: 'cattivo',
      morning: 'mattina', night: 'notte', day: 'giorno', water: 'acqua', food: 'cibo',
    },
    pt: {
      hello: 'olá', goodbye: 'adeus', 'thank you': 'obrigado', thanks: 'obrigado',
      please: 'por favor', yes: 'sim', no: 'não', good: 'bom', bad: 'mau',
      morning: 'manhã', night: 'noite', day: 'dia', water: 'água', food: 'comida',
    },
    ja: {
      hello: 'こんにちは', goodbye: 'さようなら', 'thank you': 'ありがとう', thanks: 'ありがとう',
      please: 'お願いします', yes: 'はい', no: 'いいえ', good: '良い', bad: '悪い',
    },
    zh: {
      hello: '你好', goodbye: '再见', 'thank you': '谢谢', thanks: '谢谢',
      please: '请', yes: '是', no: '否', good: '好', bad: '坏',
    },
    ko: {
      hello: '안녕하세요', goodbye: '안녕히 가세요', 'thank you': '감사합니다', thanks: '감사합니다',
      please: '제발', yes: '네', no: '아니요', good: '좋은', bad: '나쁜',
    },
  },
};

export const useOfflineTranslation = () => {
  const [state, setState] = useState<OfflineTranslationState>({
    isLoading: false,
    isTranslating: false,
    isSupported: true, // Dictionary always works
    loadProgress: 100, // Dictionary is always loaded
    error: null,
    history: [],
    availableLanguages: SUPPORTED_LANGUAGES,
  });

  const modelLoadedRef = useRef(true); // Dictionary is always available

  const fallbackTranslate = (text: string, from: string, to: string): string => {
    const translations = BASIC_TRANSLATIONS[from]?.[to];
    if (!translations) {
      // Try to find reverse translation
      const reverseTranslations = BASIC_TRANSLATIONS[to]?.[from];
      if (reverseTranslations) {
        const reverseMap = Object.fromEntries(
          Object.entries(reverseTranslations).map(([k, v]) => [v, k])
        );
        let result = text.toLowerCase();
        for (const [source, target] of Object.entries(reverseMap)) {
          result = result.replace(new RegExp(`\\b${source}\\b`, 'gi'), target);
        }
        return result;
      }
      return text; // No translation available
    }

    let result = text.toLowerCase();
    
    // Sort by phrase length (longer phrases first) to avoid partial replacements
    const sortedEntries = Object.entries(translations).sort(
      (a, b) => b[0].length - a[0].length
    );
    
    for (const [source, target] of sortedEntries) {
      result = result.replace(new RegExp(`\\b${source}\\b`, 'gi'), target);
    }
    
    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const translate = useCallback(async (
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'es'
  ): Promise<TranslationResult> => {
    setState(prev => ({ ...prev, isTranslating: true, error: null }));

    try {
      // Use dictionary-based translation
      const translatedText = fallbackTranslate(text, sourceLang, targetLang);

      const result: TranslationResult = {
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        isTranslating: false,
        history: [...prev.history.slice(-19), result],
      }));

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Translation failed';
      
      const result: TranslationResult = {
        originalText: text,
        translatedText: text, // Return original on error
        sourceLang,
        targetLang,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        isTranslating: false,
        error,
        history: [...prev.history.slice(-19), result],
      }));

      return result;
    }
  }, []);

  const detectLanguage = useCallback(async (text: string): Promise<string> => {
    // Simple language detection based on character patterns
    const patterns: [RegExp, string][] = [
      [/[\u4e00-\u9fff]/, 'zh'],
      [/[\u3040-\u30ff]/, 'ja'],
      [/[\uac00-\ud7af]/, 'ko'],
      [/[\u0600-\u06ff]/, 'ar'],
      [/[\u0900-\u097f]/, 'hi'],
      [/[\u0400-\u04ff]/, 'ru'],
      [/[äöüß]/i, 'de'],
      [/[àâçéèêëïîôùûüÿœæ]/i, 'fr'],
      [/[áéíóúñ¿¡]/i, 'es'],
      [/[àèéìòù]/i, 'it'],
      [/[ãõç]/i, 'pt'],
    ];

    for (const [pattern, lang] of patterns) {
      if (pattern.test(text)) return lang;
    }

    return 'en'; // Default to English
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  const getSupportedPairs = useCallback((): { from: string; to: string }[] => {
    const pairs: { from: string; to: string }[] = [];
    for (const [from, targets] of Object.entries(BASIC_TRANSLATIONS)) {
      for (const to of Object.keys(targets)) {
        pairs.push({ from, to });
      }
    }
    return pairs;
  }, []);

  return {
    ...state,
    translate,
    detectLanguage,
    clearHistory,
    getSupportedPairs,
    isModelLoaded: modelLoadedRef.current,
  };
};
