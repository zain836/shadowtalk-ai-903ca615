import React, { useMemo } from 'react';
import { User, Copy, RefreshCw, Volume2, VolumeX, Lock, Edit2, ExternalLink, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CodeBlock } from './CodeBlock';
import { useToast } from '@/hooks/use-toast';
import { DocumentArtifact, detectDocumentArtifact } from './DocumentArtifact';

const extractUrls = (text: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex) || [];
  return [...new Set(matches.map(url => url.replace(/[.,;:!?)]+$/, '')))];
};

const openInBrowser = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachment?: { type: 'image' | 'file'; data: string; name: string; mimeType: string };
  imageUrl?: string;
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
  onOpenIDE?: (code: string, language: string) => void;
  onLaunchWebsite?: (code: string, language: string) => void;
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
  onOpenIDE,
  onLaunchWebsite,
  onOpenInBrowser,
}) => {
  const { toast } = useToast();
  const isUser = message.type === 'user';
  const isWelcome = message.id === 'welcome';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.25, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.min(index * 0.02, 0.1)
      }}
      className={`group flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        isUser 
          ? 'bg-primary/10 border border-primary/20' 
          : 'bg-gradient-to-br from-primary to-secondary'
      }`}>
        {isUser 
          ? <User className="h-4 w-4 text-primary" /> 
          : <Sparkles className="h-4 w-4 text-primary-foreground" />
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
        {/* Image attachment */}
        {message.attachment?.type === 'image' && (
          <img 
            src={message.attachment.data} 
            alt={message.attachment.name} 
            className="max-w-[200px] sm:max-w-xs rounded-xl border border-border/30 shadow-sm" 
          />
        )}

        {/* AI Generated Image */}
        {message.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-border/30 shadow-sm max-w-md">
            <img 
              src={message.imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto object-contain"
            />
            <a 
              href={message.imageUrl} 
              download={`shadowtalk-${Date.now()}.png`}
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded-lg hover:bg-background transition-colors"
            >
              Download
            </a>
          </div>
        )}

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 w-full overflow-hidden transition-all duration-200 ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-tr-md shadow-md shadow-primary/10' 
            : 'bg-card/60 backdrop-blur-sm border border-border/30 rounded-tl-md hover:border-border/50'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{typeof message.content === 'string' ? message.content : String(message.content || '')}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2.5 prose-headings:mt-5 prose-headings:mb-2 prose-headings:first:mt-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-hr:my-4 prose-hr:border-border/40 [&_.katex]:text-foreground [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    
                    // Treat as inline if: explicitly inline, or no language AND single line with < 80 chars
                    const isShortSnippet = !match && !codeString.includes('\n') && codeString.length < 80;
                    
                    if (!inline && match) {
                      return <CodeBlock code={codeString} language={match[1]} onOpenCanvas={onOpenCodeCanvas} onOpenIDE={onOpenIDE} onLaunchWebsite={onLaunchWebsite} />;
                    }
                    if (inline || isShortSnippet) {
                      return (
                        <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock code={codeString} language="text" onOpenCanvas={onOpenCodeCanvas} onOpenIDE={onOpenIDE} onLaunchWebsite={onLaunchWebsite} />;
                  },
                  ul({ children }) { return <ul className="list-disc pl-5 space-y-1 my-2.5">{children}</ul>; },
                  ol({ children }) { return <ol className="list-decimal pl-5 space-y-1 my-2.5">{children}</ol>; },
                  li({ children }) { 
                    return (
                      <li className="text-sm leading-relaxed pl-1 marker:text-muted-foreground/60">{children}</li>
                    ); 
                  },
                  h1({ children }) { return <h1 className="text-lg font-bold tracking-tight border-b border-border/30 pb-2 mb-3">{children}</h1>; },
                  h2({ children }) { return <h2 className="text-[15px] font-bold tracking-tight mt-5 first:mt-0">{children}</h2>; },
                  h3({ children }) { return <h3 className="text-sm font-semibold mt-4 first:mt-0">{children}</h3>; },
                  h4({ children }) { return <h4 className="text-sm font-medium text-muted-foreground mt-3">{children}</h4>; },
                  p({ children }) { return <p className="text-sm leading-[1.75] mb-2.5 last:mb-0">{children}</p>; },
                  strong({ children }) { return <strong className="font-semibold text-foreground">{children}</strong>; },
                  em({ children }) { return <em className="italic text-muted-foreground">{children}</em>; },
                  hr() { return <hr className="my-4 border-border/40" />; },
                  a({ children, href }) { 
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => { e.preventDefault(); if (href) openInBrowser(href); }}
                        className="text-primary font-medium underline underline-offset-2 decoration-primary/30 hover:decoration-primary cursor-pointer inline-flex items-center gap-0.5 transition-colors"
                      >
                        {children}
                        <ExternalLink className="h-3 w-3 inline-block ml-0.5 opacity-40" />
                      </a>
                    ); 
                  },
                  blockquote({ children }) { 
                    return (
                      <blockquote className="border-l-[3px] border-primary/40 pl-4 py-1 my-3 bg-primary/5 rounded-r-lg text-muted-foreground not-italic [&_p]:mb-1 [&_p]:last:mb-0">
                        {children}
                      </blockquote>
                    ); 
                  },
                  table({ children }) { 
                    return (
                      <div className="overflow-x-auto my-3 rounded-lg border border-border/40 shadow-sm">
                        <table className="min-w-full divide-y divide-border/30">{children}</table>
                      </div>
                    ); 
                  },
                  thead({ children }) {
                    return <thead className="bg-muted/40">{children}</thead>;
                  },
                  th({ children }) { 
                    return (
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {children}
                      </th>
                    ); 
                  },
                  td({ children }) { 
                    return <td className="border-t border-border/20 px-3 py-2 text-sm">{children}</td>; 
                  },
                  tr({ children }) {
                    return <tr className="hover:bg-muted/20 transition-colors">{children}</tr>;
                  },
                }}
              >
                {typeof message.content === 'string' ? message.content : String(message.content || '')}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Extracted URLs */}
        {!isUser && !isWelcome && (() => {
          const urls = extractUrls(message.content);
          if (urls.length === 0) return null;
          const displayUrls = urls.slice(0, 3);
          
          return (
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              {displayUrls.map((url, idx) => {
                let domain = '';
                try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url.slice(0, 30); }
                
                return (
                  <div key={idx} className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInBrowser(url)}
                      className="h-6 px-2 text-[10px] gap-1 text-muted-foreground/60 hover:text-primary rounded-lg"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {domain.length > 20 ? domain.slice(0, 20) + '...' : domain}
                    </Button>
                    {onOpenInBrowser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenInBrowser(url)}
                        className="h-6 px-1 text-[10px] text-muted-foreground/40 hover:text-sky-400 rounded-lg"
                        title="Open in ShadowBrowser"
                      >
                        <Compass className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {urls.length > 3 && (
                <span className="text-[10px] text-muted-foreground/40">+{urls.length - 3}</span>
              )}
            </div>
          );
        })()}

        {/* Actions */}
        {!isWelcome && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {isUser ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(index, message.content)} 
                disabled={isLoading} 
                className="h-6 px-2 text-[10px] text-muted-foreground/50 hover:text-foreground rounded-lg"
              >
                <Edit2 className="h-2.5 w-2.5 mr-1" />
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onTextToSpeech(message.content, message.id)} 
                  disabled={isLoading} 
                  className={`h-6 px-2 text-[10px] text-muted-foreground/50 hover:text-foreground rounded-lg ${
                    userPlan !== 'pro' && userPlan !== 'elite' ? 'opacity-40' : ''
                  }`}
                >
                  {speakingMessageId === message.id && isSpeaking 
                    ? <VolumeX className="h-2.5 w-2.5 mr-1" /> 
                    : <Volume2 className="h-2.5 w-2.5 mr-1" />
                  }
                  {userPlan !== 'pro' && userPlan !== 'elite' && <Lock className="h-2 w-2 mr-0.5" />}
                  {speakingMessageId === message.id && isSpeaking ? 'Stop' : 'Listen'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRegenerate(index)} 
                  disabled={isLoading} 
                  className="h-6 px-2 text-[10px] text-muted-foreground/50 hover:text-foreground rounded-lg"
                >
                  <RefreshCw className={`h-2.5 w-2.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy} 
              className="h-6 px-2 text-[10px] text-muted-foreground/50 hover:text-foreground rounded-lg"
            >
              <Copy className="h-2.5 w-2.5 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
