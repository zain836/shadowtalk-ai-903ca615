export interface SlideContent {
  [key: string]: unknown;
}

export interface Slide {
  id: string;
  layout: string;
  title: string;
  subtitle?: string;
  content: SlideContent;
  speakerNotes?: string;
  transition?: string;
}

export interface PresentationData {
  title: string;
  slides: Slide[];
  metadata?: {
    estimatedDuration?: number;
    targetAudience?: string;
    keyTakeaways?: string[];
  };
}

export type ThemeKey = 'corporate' | 'startup' | 'academic' | 'creative' | 'minimal' | 'dark_elegance';

export const THEMES: Record<ThemeKey, { name: string; bg: string; accent: string; text: string; secondaryBg: string; accentGradient: string; accentEnd: string }> = {
  corporate: { name: "Corporate", bg: "#FFFFFF", accent: "#1E40AF", accentEnd: "#3B82F6", text: "#111827", secondaryBg: "#F3F4F6", accentGradient: "linear-gradient(135deg, #1E40AF, #3B82F6)" },
  startup: { name: "Startup", bg: "#0F172A", accent: "#8B5CF6", accentEnd: "#EC4899", text: "#F8FAFC", secondaryBg: "#1E293B", accentGradient: "linear-gradient(135deg, #8B5CF6, #EC4899)" },
  academic: { name: "Academic", bg: "#FFFBEB", accent: "#92400E", accentEnd: "#D97706", text: "#1C1917", secondaryBg: "#FEF3C7", accentGradient: "linear-gradient(135deg, #92400E, #D97706)" },
  creative: { name: "Creative", bg: "#FDF2F8", accent: "#DB2777", accentEnd: "#F97316", text: "#1F2937", secondaryBg: "#FCE7F3", accentGradient: "linear-gradient(135deg, #DB2777, #F97316)" },
  minimal: { name: "Minimal", bg: "#FAFAFA", accent: "#18181B", accentEnd: "#52525B", text: "#18181B", secondaryBg: "#F4F4F5", accentGradient: "linear-gradient(135deg, #18181B, #52525B)" },
  dark_elegance: { name: "Dark Elegance", bg: "#09090B", accent: "#FBBF24", accentEnd: "#F59E0B", text: "#FAFAFA", secondaryBg: "#18181B", accentGradient: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
};
