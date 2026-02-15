import React from 'react';
 import { Bot, Sparkles, Zap, Brain } from 'lucide-react';
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
  onOpenInBrowser,
  messagesEndRef,
   thinkingStage,
}) => {
   // Thinking stage info
   const STAGE_INFO = {
     understanding: { text: 'Understanding your query', icon: '🧠', color: 'text-blue-500' },
     reasoning: { text: 'Deep reasoning', icon: '⚡', color: 'text-amber-500' },
     generating: { text: 'Generating response', icon: '✨', color: 'text-violet-500' },
     refining: { text: 'Refining answer', icon: '🎯', color: 'text-emerald-500' },
   };
 
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
            onOpenInBrowser={onOpenInBrowser}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
           <motion.div 
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
             className="flex items-start gap-2 sm:gap-3"
           >
             <motion.div 
               animate={{ 
                 scale: [1, 1.08, 1],
                 boxShadow: [
                   '0 0 0 0 rgba(var(--primary-rgb), 0)',
                   '0 0 25px 8px rgba(var(--primary-rgb), 0.35)',
                   '0 0 0 0 rgba(var(--primary-rgb), 0)'
                 ]
               }}
               transition={{ duration: 2, repeat: Infinity }}
               className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg gradient-animate"
             >
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
               >
                 <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
               </motion.div>
             </motion.div>
             
             <div className="relative">
               <AIResponseGlow isActive={true} />
               <motion.div 
                 className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-3 py-2 sm:px-4 sm:py-3 shadow-sm"
                 animate={{ borderColor: ['hsl(var(--border) / 0.5)', 'hsl(var(--primary) / 0.3)', 'hsl(var(--border) / 0.5)'] }}
                 transition={{ duration: 2, repeat: Infinity }}
               >
                 <div className="flex items-center gap-3">
                   {/* Animated dots with wave effect */}
                   <div className="flex gap-1.5">
                     {[0, 1, 2].map((i) => (
                       <motion.div
                         key={i}
                         animate={{ 
                           y: [0, -6, 0],
                           scale: [1, 1.2, 1],
                           opacity: [0.4, 1, 0.4]
                         }}
                         transition={{ 
                           duration: 0.7, 
                           repeat: Infinity, 
                           delay: i * 0.15,
                           ease: [0.45, 0, 0.55, 1] as const
                         }}
                         className="w-2 h-2 bg-primary rounded-full" 
                       />
                     ))}
                   </div>
                   
                   {/* Thinking stage indicator */}
                   <AnimatePresence mode="wait">
                     {thinkingStage && (
                       <motion.div
                         key={thinkingStage}
                         initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                         animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                         exit={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                         transition={{ duration: 0.3 }}
                         className={`flex items-center gap-1.5 text-xs ${STAGE_INFO[thinkingStage].color}`}
                       >
                         <motion.span
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ duration: 1, repeat: Infinity }}
                         >
                           {STAGE_INFO[thinkingStage].icon}
                         </motion.span>
                         <span className="font-medium">{STAGE_INFO[thinkingStage].text}</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              </motion.div>
            </div>
           </motion.div>
        )}

        {/* Scroll anchor - always visible for auto-scroll */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
};
