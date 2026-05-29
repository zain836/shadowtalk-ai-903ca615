import React, { useEffect, useRef } from 'react';
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
  onOpenIDE?: (code: string, language: string) => void;
  onLaunchWebsite?: (code: string, language: string) => void;
  onOpenInBrowser?: (url: string) => void;
  onConfirmTool?: (messageId: string) => void;
  onCancelTool?: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  thinkingStage?: 'understanding' | 'reasoning' | 'generating' | 'refining' | null;
  layout?: 'default' | 'gemini';
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
  onOpenIDE,
  onLaunchWebsite,
  onOpenInBrowser,
  messagesEndRef,
  thinkingStage,
  layout = 'default',
}) => {
  const isGemini = layout === 'gemini';
  const STAGE_INFO = {
    understanding: { text: 'Parsing intent & context', icon: '🧠', color: 'text-blue-400', glow: 'shadow-blue-500/20' },
    reasoning: { text: 'Chain-of-thought reasoning', icon: '⚡', color: 'text-amber-400', glow: 'shadow-amber-500/20' },
    generating: { text: 'Synthesizing response', icon: '✨', color: 'text-violet-400', glow: 'shadow-violet-500/20' },
    refining: { text: 'Polishing & validating', icon: '🎯', color: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when suggestions are shown (initial state)
  useEffect(() => {
    if (showSuggestions && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [showSuggestions]);

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      <div
        className={`mx-auto px-4 sm:px-6 py-6 sm:py-10 ${
          isGemini ? 'max-w-[720px] space-y-6 sm:space-y-8' : 'max-w-4xl space-y-8 sm:space-y-12'
        }`}
      >
        {/* Suggested prompts */}
        {showSuggestions && (
          <div className="min-h-[calc(100dvh-13rem)] flex items-center justify-center">
            <SuggestedPrompts 
              onSelect={onSelectPrompt} 
              personality={personality}
            />
          </div>
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
            onOpenIDE={onOpenIDE}
            onLaunchWebsite={onLaunchWebsite}
            onOpenInBrowser={onOpenInBrowser}
            variant={isGemini ? 'neural' : 'default'}
          />
        ))}

        {/* Premium thinking indicator */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex items-start gap-3"
          >
            <motion.div 
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            </motion.div>
            
            <div className="relative">
              <AIResponseGlow isActive={true} />
              <motion.div 
                className="bg-card/90 backdrop-blur-md border border-border/40 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg"
              >
                <div className="flex flex-col gap-2">
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                          className="w-1.5 h-1.5 bg-primary rounded-full" 
                        />
                      ))}
                    </div>
                    
                    {/* Thinking stage with enhanced animation */}
                    <AnimatePresence mode="wait">
                      {thinkingStage && (
                        <motion.div
                          key={thinkingStage}
                          initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                          transition={{ duration: 0.3 }}
                          className={`flex items-center gap-1.5 text-xs font-medium ${STAGE_INFO[thinkingStage].color}`}
                        >
                          <motion.span 
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-sm"
                          >
                            {STAGE_INFO[thinkingStage].icon}
                          </motion.span>
                          <span>{STAGE_INFO[thinkingStage].text}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Animated progress track */}
                  {thinkingStage && (
                    <motion.div 
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      className="h-0.5 bg-muted rounded-full overflow-hidden origin-left"
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary via-primary/60 to-primary rounded-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '50%' }}
                      />
                    </motion.div>
                  )}
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
