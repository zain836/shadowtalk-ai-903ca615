import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { AIResponseGlow } from './PremiumChatEffects';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  showSuggestions: boolean;
  personality: string;
  userPlan: string;
  speakingMessageId: string | null;
  isSpeaking: boolean;
  onSelectPrompt: (prompt: string) => void;
  onEdit: (index: number, content: string) => void;
  onRegenerate: (index: number) => void;
  onTextToSpeech: (text: string, messageId: string) => void;
  onOpenCodeCanvas: (code: string, language: string) => void;
  onLaunchWebsite?: (code: string, language: string) => void;
  onOpenInBrowser?: (url: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  thinkingStage?: 'understanding' | 'reasoning' | 'generating' | 'refining' | null;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  showSuggestions,
  personality,
  userPlan,
  speakingMessageId,
  isSpeaking,
  onSelectPrompt,
  onEdit,
  onRegenerate,
  onTextToSpeech,
  onOpenCodeCanvas,
  onLaunchWebsite,
  onOpenInBrowser,
  messagesEndRef,
  thinkingStage,
}) => {
  const STAGE_INFO = {
    understanding: { text: 'Understanding your query', icon: '🧠', color: 'text-blue-400' },
    reasoning: { text: 'Deep reasoning', icon: '⚡', color: 'text-amber-400' },
    generating: { text: 'Generating response', icon: '✨', color: 'text-violet-400' },
    refining: { text: 'Refining answer', icon: '🎯', color: 'text-emerald-400' },
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Suggested prompts */}
        {showSuggestions && (
          <SuggestedPrompts 
            onSelect={onSelectPrompt} 
            personality={personality}
          />
        )}

        {/* Messages */}
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            index={index}
            isLoading={isLoading}
            userPlan={userPlan}
            speakingMessageId={speakingMessageId}
            isSpeaking={isSpeaking}
            onEdit={onEdit}
            onRegenerate={onRegenerate}
            onTextToSpeech={onTextToSpeech}
            onOpenCodeCanvas={onOpenCodeCanvas}
            onLaunchWebsite={onLaunchWebsite}
            onOpenInBrowser={onOpenInBrowser}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-3"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.06, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            </motion.div>
            
            <div className="relative">
              <AIResponseGlow isActive={true} />
              <motion.div 
                className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {/* Typing dots */}
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          y: [0, -5, 0],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{ 
                          duration: 0.8, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: 'easeInOut'
                        }}
                        className="w-1.5 h-1.5 bg-primary/70 rounded-full" 
                      />
                    ))}
                  </div>
                  
                  {/* Thinking stage */}
                  <AnimatePresence mode="wait">
                    {thinkingStage && (
                      <motion.div
                        key={thinkingStage}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-center gap-1.5 text-xs ${STAGE_INFO[thinkingStage].color}`}
                      >
                        <span className="text-xs">{STAGE_INFO[thinkingStage].icon}</span>
                        <span className="font-medium">{STAGE_INFO[thinkingStage].text}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
};
