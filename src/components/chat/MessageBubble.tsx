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
import { ToolExecutionCard } from './ToolExecutionCard';
import { ToolType } from '@/hooks/useToolOrchestrator';

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
  toolExecution?: { tool: string; status: 'pending' | 'running' | 'complete' | 'error' | 'confirm'; params?: Record<string, string>; result?: string };
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

  // Detect document artifacts in AI responses
  const documentArtifact = useMemo(() => {
    if (isUser || isWelcome) return null;
    return detectDocumentArtifact(message.content);
  }, [message.content, isUser, isWelcome]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: Math.min(index * 0.02, 0.1)
      }}
      className={`group flex items-start gap-4 md:gap-6 py-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 sm:w-[36px] sm:h-[36px] rounded-full flex items-center justify-center shrink-0 transition-all duration-300 select-none ${
        isUser 
          ? 'bg-[#1e1f20]/60 border border-border/15' 
          : 'bg-transparent'
      }`}>
        {isUser 
          ? <User className="h-5 w-5 text-muted-foreground/70" /> 
          : (
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Sparkles className="h-7 w-7 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
              </motion.div>
            </div>
          )
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[80%]`} style={{ width: '100%' }}>
        {/* Image attachment */}
        {message.attachment?.type === 'image' && (
          <img 
            src={message.attachment.data} 
            alt={message.attachment.name} 
            className="max-w-[200px] sm:max-w-md rounded-2xl border border-border/10 shadow-lg mb-2" 
          />
        )}

        {/* AI Generated Image */}
        {message.imageUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-border/10 shadow-lg max-w-xl mb-3 group/image">
            <img 
              src={message.imageUrl} 
              alt="AI Generated" 
              className="w-full h-auto object-contain transition-transform duration-500 group-hover/image:scale-[1.02]"
            />
            <a 
              href={message.imageUrl} 
              download={`shadowtalk-${Date.now()}.png`}
              className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[12px] font-medium px-4 py-2 rounded-full hover:bg-black/80 transition-all opacity-0 group-hover/image:opacity-100 translate-y-2 group-hover/image:translate-y-0 shadow-lg"
            >
              Download
            </a>
          </div>
        )}

        {/* Message bubble */}
        <div className={`w-full transition-all duration-300 ${
          isUser 
            ? isNeural
              ? 'bg-muted/25 border border-border/40 text-foreground rounded-[24px] rounded-tr-md px-5 py-3 shadow-sm max-w-max'
              : 'bg-[#1e1f20]/45 border border-border/10 text-foreground rounded-[28px] rounded-tr-sm px-6 py-3.5 shadow-sm max-w-max'
            : isNeural
              ? 'neural-response-card article-response px-5 py-4'
              : 'bg-transparent border-none shadow-none px-0 py-1 article-response'
        }`}>
          {isUser ? (
            <p className="text-[15.5px] leading-relaxed whitespace-pre-wrap break-words font-normal tracking-wide">{typeof message.content === 'string' ? message.content : String(message.content || '')}</p>
          ) : (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:my-5 prose-headings:mt-10 prose-headings:mb-5 prose-headings:first:mt-0 prose-ul:my-6 prose-ol:my-6 prose-li:my-2 prose-hr:my-10 prose-hr:border-border/10 [&_.katex]:text-foreground [&_.katex-display]:my-10 [&_.katex-display]:overflow-x-auto overflow-hidden">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    
                    const isShortSnippet = !match && !codeString.includes('\n') && codeString.length < 80;
                    
                    if (!inline && match) {
                      return <CodeBlock code={codeString} language={match[1]} onOpenCanvas={onOpenCodeCanvas} onOpenIDE={onOpenIDE} onLaunchWebsite={onLaunchWebsite} />;
                    }
                    if (inline || isShortSnippet) {
                      return (
                        <code className="bg-muted/50 text-foreground/90 px-1.5 py-0.5 rounded text-[14.5px] font-mono" {...props}>
                          {children}
                        </code>
                      );
                      
                    }
                    return <CodeBlock code={codeString} language="text" onOpenCanvas={onOpenCodeCanvas} onOpenIDE={onOpenIDE} onLaunchWebsite={onLaunchWebsite} />;
                  },
                  ul({ children }) { return <ul className="list-disc pl-7 space-y-3 my-6 marker:text-foreground/30">{children}</ul>; },
                  ol({ children }) { return <ol className="list-decimal pl-7 space-y-3 my-6 marker:text-foreground/40 marker:font-bold">{children}</ol>; },
                  li({ children, ...props }: any) {
                    // Task list checkbox support
                    const text = String(children);
                    const isChecked = text.match(/^\[x\]/i);
                    const isUnchecked = text.match(/^\[ \]/);
                    
                    if (isChecked || isUnchecked) {
                      return (
                        <li className="flex items-start gap-4 list-none -ml-6 my-3" {...props}>
                          <span className={`mt-1.5 w-5 h-5 rounded-md border flex items-center justify-center text-[12px] shrink-0 ${
                            isChecked ? 'bg-primary/30 border-primary/50 text-primary' : 'border-border/60'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                          <span className={isChecked ? 'line-through text-muted-foreground/40' : ''}>
                            {text.replace(/^\[[ x]\]\s*/i, '')}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li className="text-[16.5px] leading-relaxed pl-1" {...props}>{children}</li>
                    ); 
                  },
                  h1({ children }) { 
                    return (
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-foreground/95 border-b border-border/5 pb-4">
                        {children}
                      </h1>
                    ); 
                  },
                  h2({ children }) { 
                    return (
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-12 first:mt-0 mb-6 text-foreground/90">
                        {children}
                      </h2>
                    ); 
                  },
                  h3({ children }) { return <h3 className="text-xl md:text-2xl font-semibold mt-10 first:mt-0 text-foreground/85 tracking-tight">{children}</h3>; },
                  h4({ children }) { return <h4 className="text-lg md:text-xl font-medium text-muted-foreground mt-6">{children}</h4>; },
                  p({ children }) { return <p className="text-[16.5px] md:text-[17.5px] leading-relaxed mb-6 last:mb-0 text-foreground/85 font-normal tracking-wide">{children}</p>; },
                  strong({ children }) { return <strong className="font-bold text-foreground/95">{children}</strong>; },
                  em({ children }) { return <em className="italic text-foreground/70">{children}</em>; },
                  hr() { return <hr className="my-12 border-border/10" />; },
                  a({ children, href }) { 
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => { e.preventDefault(); if (href) openInBrowser(href); }}
                        className="text-blue-400 font-semibold hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-400/70 cursor-pointer transition-all duration-300"
                      >
                        {children}
                      </a>
                    ); 
                  },
                  blockquote({ children }) {
                    // Detect callout type from emoji prefix
                    const text = String(children);
                    const isWarning = text.includes('⚠️');
                    const isSuccess = text.includes('✅');
                    const isKey = text.includes('🔑') || text.includes('📌');
                    const isTip = text.includes('💡');
                    
                    const borderColor = isWarning ? 'border-amber-400/50' : isSuccess ? 'border-emerald-400/50' : isKey ? 'border-violet-400/50' : isTip ? 'border-sky-400/50' : 'border-primary/30';
                    const bgColor = isWarning ? 'bg-amber-500/[0.04]' : isSuccess ? 'bg-emerald-500/[0.04]' : isKey ? 'bg-violet-500/[0.04]' : isTip ? 'bg-sky-500/[0.04]' : 'bg-primary/[0.03]';
                    
                    return (
                      <blockquote className={`border-l-[4px] ${borderColor} pl-6 py-4 my-6 ${bgColor} rounded-r-2xl text-foreground/85 not-italic [&_p]:mb-2 [&_p]:last:mb-0 [&_p]:text-[15px] [&_p]:leading-relaxed font-medium`}>
                        {children}
                      </blockquote>
                    ); 
                  },
                  table({ children }) { 
                    return (
                      <div className="overflow-x-auto my-6 rounded-2xl border border-border/10 shadow-md bg-[#1e1f20]/20">
                        <table className="min-w-full divide-y divide-border/10">{children}</table>
                      </div>
                    ); 
                  },
                  thead({ children }) {
                    return <thead className="bg-muted/20">{children}</thead>;
                  },
                  th({ children }) { 
                    return (
                      <th className="px-5 py-3 text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {children}
                      </th>
                    ); 
                  },
                  td({ children }) { 
                    return <td className="border-t border-border/10 px-5 py-3.5 text-[15px] text-foreground/80">{children}</td>; 
                  },
                  tr({ children }) {
                    return <tr className="hover:bg-muted/5 transition-colors duration-150">{children}</tr>;
                  },
                  // Enhanced image rendering
                  img({ src, alt }) {
                    return (
                      <img 
                        src={src} 
                        alt={alt || ''} 
                        className="rounded-2xl border border-border/10 shadow-xl max-w-full h-auto my-6"
                        loading="lazy"
                      />
                    );
                  },
                }}
              >
                {typeof message.content === 'string' ? message.content : String(message.content || '')}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Tool Execution Card */}
        {message.toolExecution && (
          <ToolExecutionCard
            tool={message.toolExecution.tool as ToolType}
            status={message.toolExecution.status}
            params={message.toolExecution.params}
            result={message.toolExecution.result}
          />
        )}

        {/* Document Artifact - auto-detected from AI response */}
        {documentArtifact && (
          <DocumentArtifact
            title={documentArtifact.title}
            content={documentArtifact.documentContent}
            type={documentArtifact.type}
          />
        )}

        {/* Extracted URLs */}
        {!isUser && !isWelcome && (() => {
          const urls = extractUrls(message.content);
          if (urls.length === 0) return null;
          const displayUrls = urls.slice(0, 3);
          
          return (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {displayUrls.map((url, idx) => {
                let domain = '';
                try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url.slice(0, 30); }
                
                return (
                  <div key={idx} className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInBrowser(url)}
                      className="h-7 px-3 text-[11px] gap-1.5 text-muted-foreground/60 hover:text-blue-400 rounded-full bg-muted/20 hover:bg-muted/40 transition-all"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {domain.length > 20 ? domain.slice(0, 20) + '...' : domain}
                    </Button>
                    {onOpenInBrowser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenInBrowser(url)}
                        className="h-7 px-2 text-[11px] text-muted-foreground/40 hover:text-cyan-400 rounded-full transition-all"
                        title="Open in ShadowBrowser"
                      >
                        <Compass className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {urls.length > 3 && (
                <span className="text-[11px] text-muted-foreground/30 px-2 font-medium">+{urls.length - 3} more sources</span>
              )}
            </div>
          );
        })()}

        {/* Actions */}
        {!isWelcome && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 mt-2">
            {isUser ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(index, message.content)} 
                disabled={isLoading} 
                className="h-8 px-3 text-[11px] text-muted-foreground/60 hover:text-foreground rounded-full hover:bg-muted/40"
              >
                <Edit2 className="h-3 w-3 mr-1.5" />
                Edit
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onTextToSpeech(message.content, message.id)} 
                  disabled={isLoading} 
                  className={`h-8 px-3 text-[11px] text-muted-foreground/60 hover:text-foreground rounded-full hover:bg-muted/40 ${
                    userPlan !== 'pro' && userPlan !== 'elite' ? 'opacity-40' : ''
                  }`}
                >
                  {speakingMessageId === message.id && isSpeaking 
                    ? <VolumeX className="h-3 w-3 mr-1.5" /> 
                    : <Volume2 className="h-3 w-3 mr-1.5" />
                  }
                  {userPlan !== 'pro' && userPlan !== 'elite' && <Lock className="h-2.5 w-2.5 mr-1" />}
                  {speakingMessageId === message.id && isSpeaking ? 'Stop' : 'Listen'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRegenerate(index)} 
                  disabled={isLoading} 
                  className="h-8 px-3 text-[11px] text-muted-foreground/60 hover:text-foreground rounded-full hover:bg-muted/40"
                >
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy} 
              className="h-8 px-3 text-[11px] text-muted-foreground/60 hover:text-foreground rounded-full hover:bg-muted/40"
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Copy
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
