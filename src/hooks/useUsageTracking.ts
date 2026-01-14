import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { Json } from '@/integrations/supabase/types';

export type ActionType = 
  | 'chat_message' 
  | 'image_generation' 
  | 'voice_input' 
  | 'text_to_speech' 
  | 'code_execution' 
  | 'file_upload'
  | 'conversation_created'
  | 'mode_switch';

export type QueryCategory = 
  | 'general' 
  | 'code' 
  | 'translate' 
  | 'summarize' 
  | 'debug' 
  | 'brainstorm' 
  | 'image' 
  | 'explain' 
  | 'creative' 
  | 'music'
  | 'search';

export interface TrackingMetadata {
  personality?: string;
  mode?: string;
  hasAttachment?: boolean;
  attachmentType?: string;
  messageLength?: number;
  responseLength?: number;
  tokensUsed?: number;
  [key: string]: Json | undefined;
}

export const useUsageTracking = () => {
  const { user } = useAuth();

  const trackUsage = useCallback(async (
    actionType: ActionType,
    queryCategory?: QueryCategory,
    featureUsed?: string,
    tokensUsed?: number,
    metadata?: TrackingMetadata
  ) => {
    if (!user) return;

    try {
      const cleanMetadata: Record<string, Json> = {};
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanMetadata[key] = value as Json;
          }
        });
      }

      await supabase.from('usage_analytics').insert({
        user_id: user.id,
        action_type: actionType,
        query_category: queryCategory,
        feature_used: featureUsed,
        tokens_used: tokensUsed || 0,
        metadata: cleanMetadata
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }, [user]);

  const trackChatMessage = useCallback((
    mode: QueryCategory,
    personality: string,
    messageLength: number,
    hasAttachment: boolean,
    attachmentType?: string
  ) => {
    return trackUsage('chat_message', mode, 'chat', undefined, {
      personality,
      mode,
      messageLength,
      hasAttachment,
      attachmentType
    });
  }, [trackUsage]);

  const trackImageGeneration = useCallback((prompt: string) => {
    return trackUsage('image_generation', 'image', 'image_generator', undefined, {
      messageLength: prompt.length
    });
  }, [trackUsage]);

  const trackVoiceInput = useCallback(() => {
    return trackUsage('voice_input', undefined, 'voice_input');
  }, [trackUsage]);

  const trackTextToSpeech = useCallback(() => {
    return trackUsage('text_to_speech', undefined, 'text_to_speech');
  }, [trackUsage]);

  const trackCodeExecution = useCallback((language: string) => {
    return trackUsage('code_execution', 'code', 'code_canvas', undefined, {
      mode: language
    });
  }, [trackUsage]);

  const trackFileUpload = useCallback((fileType: string) => {
    return trackUsage('file_upload', undefined, 'file_upload', undefined, {
      attachmentType: fileType
    });
  }, [trackUsage]);

  const trackModeSwitch = useCallback((newMode: string) => {
    return trackUsage('mode_switch', newMode as QueryCategory, 'mode_selector', undefined, {
      mode: newMode
    });
  }, [trackUsage]);

  const trackConversationCreated = useCallback(() => {
    return trackUsage('conversation_created', undefined, 'conversation');
  }, [trackUsage]);

  return {
    trackUsage,
    trackChatMessage,
    trackImageGeneration,
    trackVoiceInput,
    trackTextToSpeech,
    trackCodeExecution,
    trackFileUpload,
    trackModeSwitch,
    trackConversationCreated
  };
};
