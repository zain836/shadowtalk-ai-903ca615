import React from 'react';
import { Bot, User, Copy, RefreshCw, Volume2, VolumeX, Lock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { useToast } from '@/hooks/use-toast';

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
}) => {
  const { toast } = useToast();
  const isUser = message.type === 'user';
  const isWelcome = message.id === 'welcome';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className={`group flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
        isUser 
          ? 'bg-primary' 
          : 'bg-gradient-to-br from-primary to-secondary'
      }`}>
        {isUser 
          ? <User className="h-4 w-4 text-primary-foreground" /> 
          : <Bot className="h-4 w-4 text-primary-foreground" />
        }
      </div>

      {/* Content */}
      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Image attachment (user uploaded) */}
        {message.attachment?.type === 'image' && (
          <img 
            src={message.attachment.data} 
            alt={message.attachment.name} 
            className="max-w-xs rounded-xl border border-border/50 shadow-sm" 
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
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-card border border-border/50 shadow-sm rounded-bl-md'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
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
                  p({ children }) { return <p className="text-sm leading-relaxed">{children}</p>; },
                  a({ children, href }) { 
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer" 
                         className="text-primary underline underline-offset-2 hover:no-underline">
                        {children}
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
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

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
    </div>
  );
};
