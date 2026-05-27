export type BehaviorEventType =
  | "chat_send"
  | "mode_change"
  | "personality_change"
  | "feature_open"
  | "see_launch"
  | "regenerate"
  | "conversation_new"
  | "mission_complete"
  | "deep_research"
  | "image_gen";

export interface BehaviorEvent {
  id: string;
  ts: number;
  type: BehaviorEventType;
  payload?: Record<string, string | number | boolean>;
}

export interface ImprovementApplied {
  id: string;
  label: string;
  appliedAt: string;
  reason: string;
}

export interface LearnedProfile {
  version: 1;
  updatedAt: string;
  eventCount: number;
  confidence: number;
  preferredMode?: string;
  preferredPersonality?: string;
  preferSeeRouting?: boolean;
  topCategories: string[];
  peakHour?: number;
  systemHintAddon?: string;
  recentImprovements: ImprovementApplied[];
}

export const EMPTY_PROFILE: LearnedProfile = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  eventCount: 0,
  confidence: 0,
  topCategories: [],
  recentImprovements: [],
};

export const PROFILE_SETTING_KEY = "auto_improve_profile";
