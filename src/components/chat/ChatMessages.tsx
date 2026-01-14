import React from 'react';
import { Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';

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
  messagesEndRef: React.RefObject<HTMLDivElement>;
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
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
