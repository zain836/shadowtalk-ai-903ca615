import React, { useMemo } from 'react';
 import { Bot, User, Copy, RefreshCw, Volume2, VolumeX, Lock, Edit2, ExternalLink, Compass, Sparkles, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
 import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { useToast } from '@/hooks/use-toast';

// Extract URLs from text content
const extractUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex) || [];
  // Remove duplicates and clean trailing punctuation
  return [...new Set(matches.map(url => url.replace(/[.,;:!?)]+$/, '')))];
};

// Open URL in new browser tab
const openInBrowser = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string; // For AI-generated images
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  isLoading: boolean;
  userPlan: string;
  speakingMessageId: string | null;
  isSpeaking: boolean;
  onEdit: (index: number, content: string) => void;
  onRegenerate: (index: number) => void;
  onTextToSpeech: (text: string, messageId: string) => void;
  onOpenCodeCanvas: (code: string, language: string) => void;
  onOpenInBrowser?: (url: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  index,
  isLoading,
  userPlan,
  speakingMessageId,
  isSpeaking,
  onEdit,
  onRegenerate,
  onTextToSpeech,
  onOpenCodeCanvas,
  onOpenInBrowser,
}) => {
  const { toast } = useToast();
  const isUser = message.type === 'user';
  const isWelcome = message.id === 'welcome';
   
   // Determine if this is a recent AI message (for animations)
   const isRecent = Date.now() - message.timestamp.getTime() < 5000;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied to clipboard' });
  };

  return (
     <motion.div 
       initial={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(4px)' }}
       animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
       transition={{ 
         duration: 0.35, 
         ease: [0.25, 0.46, 0.45, 0.94] as const,
         delay: Math.min(index * 0.03, 0.15) // stagger but cap at 150ms
       }}
       className={`group flex items-start gap-2 sm:gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
     >
      {/* Avatar */}
       <motion.div 
         whileHover={{ scale: 1.05 }}
         className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
        isUser 
          ? 'bg-primary' 
           : 'bg-gradient-to-br from-primary via-secondary to-primary'
       }`}
       >
        {isUser 
          ? <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" /> 
           : <motion.div
               animate={isRecent && !isWelcome ? { rotate: [0, 10, -10, 0] } : {}}
               transition={{ duration: 0.5 }}
             >
               <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
             </motion.div>
        }
       </motion.div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        {/* Image attachment (user uploaded) */}
        {message.attachment?.type === 'image' && (
          <img 
            src={message.attachment.data} 
            alt={message.attachment.name} 
            className="max-w-[200px] sm:max-w-xs rounded-xl border border-border/50 shadow-sm" 
          />
        )}

        {/* AI Generated Image */}
        {message.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm max-w-md">
            <img 
              src={message.imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto object-contain"
            />
            <a 
              href={message.imageUrl} 
              download={`shadowtalk-${Date.now()}.png`}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-md hover:bg-background transition-colors"
            >
              Download
            </a>
          </div>
        )}

        {/* Message bubble */}
         <motion.div 
           initial={isRecent ? { boxShadow: '0 0 20px 5px rgba(var(--primary-rgb), 0.2)' } : {}}
           animate={{ boxShadow: '0 0 0 0 rgba(var(--primary-rgb), 0)' }}
           transition={{ duration: 2 }}
           className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 w-full overflow-hidden transition-shadow ${
          isUser 
             ? 'bg-primary text-primary-foreground rounded-br-md shadow-md' 
             : 'bg-card border border-border/50 shadow-sm rounded-bl-md hover:shadow-md'
         }`}
         >
          {isUser ? (
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{typeof message.content === 'string' ? message.content : String(message.content || '')}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-3 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 [&_.katex]:text-foreground [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return <CodeBlock code={codeString} language={match[1]} onOpenCanvas={onOpenCodeCanvas} />;
                    }
                    return inline ? (
                      <code className="bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                        {children}
                      </code>
                    ) : (
                      <CodeBlock code={codeString} language="text" onOpenCanvas={onOpenCodeCanvas} />
                    );
                  },
                  ul({ children }) { return <ul className="list-disc pl-4 space-y-0.5 my-1.5">{children}</ul>; },
                  ol({ children }) { return <ol className="list-decimal pl-4 space-y-0.5 my-1.5">{children}</ol>; },
                  li({ children }) { return <li className="text-sm leading-relaxed">{children}</li>; },
                  h1({ children }) { return <h1 className="text-base font-bold">{children}</h1>; },
                  h2({ children }) { return <h2 className="text-sm font-bold">{children}</h2>; },
                  h3({ children }) { return <h3 className="text-sm font-semibold">{children}</h3>; },
                  p({ children }) { return <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>; },
                  a({ children, href }) { 
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (href) openInBrowser(href);
                        }}
                        className="text-primary underline underline-offset-2 hover:no-underline cursor-pointer inline-flex items-center gap-0.5"
                      >
                        {children}
                        <ExternalLink className="h-3 w-3 inline-block ml-0.5" />
                      </a>
                    ); 
                  },
                  blockquote({ children }) { 
                    return (
                      <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
                        {children}
                      </blockquote>
                    ); 
                  },
                  table({ children }) { 
                    return (
                      <div className="overflow-x-auto my-2 rounded-lg border border-border">
                        <table className="min-w-full">{children}</table>
                      </div>
                    ); 
                  },
                  th({ children }) { 
                    return (
                      <th className="border-b border-border px-3 py-2 bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider">
                        {children}
                      </th>
                    ); 
                  },
                  td({ children }) { 
                    return <td className="border-b border-border/50 px-3 py-2 text-sm">{children}</td>; 
                  },
                }}
              >
                {typeof message.content === 'string' ? message.content : String(message.content || '')}
              </ReactMarkdown>
            </div>
          )}
         </motion.div>

        {/* Extracted URLs - Quick open buttons for AI responses */}
        {!isUser && !isWelcome && (() => {
          const urls = extractUrls(message.content);
          if (urls.length === 0) return null;
          
          // Show at most 3 quick-open buttons
          const displayUrls = urls.slice(0, 3);
          
          return (
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {displayUrls.map((url, idx) => {
                // Extract domain for display
                let domain = '';
                try {
                  domain = new URL(url).hostname.replace('www.', '');
                } catch {
                  domain = url.slice(0, 30);
                }
                
                return (
                  <div key={idx} className="flex items-center gap-0.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInBrowser(url)}
                      className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary rounded-r-none"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {domain.length > 20 ? domain.slice(0, 20) + '...' : domain}
                    </Button>
                    {onOpenInBrowser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenInBrowser(url)}
                        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-sky-500 rounded-l-none border-l-0"
                        title="Open in ShadowBrowser"
                      >
                        <Compass className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {urls.length > 3 && (
                <span className="text-xs text-muted-foreground">+{urls.length - 3} more</span>
              )}
            </div>
          );
        })()}

        {/* Actions */}
        {!isWelcome && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(index, message.content)} 
                disabled={isLoading} 
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onTextToSpeech(message.content, message.id)} 
                  disabled={isLoading} 
                  className={`h-7 px-2 text-xs text-muted-foreground hover:text-foreground ${
                    userPlan !== 'pro' && userPlan !== 'elite' ? 'opacity-50' : ''
                  }`}
                >
                  {speakingMessageId === message.id && isSpeaking 
                    ? <VolumeX className="h-3 w-3 mr-1" /> 
                    : <Volume2 className="h-3 w-3 mr-1" />
                  }
                  {userPlan !== 'pro' && userPlan !== 'elite' && <Lock className="h-2 w-2 mr-0.5" />}
                  {speakingMessageId === message.id && isSpeaking ? 'Stop' : 'Listen'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRegenerate(index)} 
                  disabled={isLoading} 
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy} 
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </div>
     </motion.div>
  );
};
