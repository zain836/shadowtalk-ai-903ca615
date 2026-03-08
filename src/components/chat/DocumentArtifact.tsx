import React, { useState, useRef, useMemo } from 'react';
import { FileText, Download, Edit3, Check, X, Copy, Maximize2, Minimize2, FileDown, BookOpen, List, Printer, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DocumentArtifactProps {
  title: string;
  content: string;
  type: 'email' | 'article' | 'report' | 'proposal' | 'resume' | 'letter' | 'plan' | 'document';
}

const typeConfig: Record<string, { icon: string; accent: string; label: string; bg: string }> = {
  email: { icon: '✉️', accent: 'border-l-blue-500', label: 'Email', bg: 'from-blue-500/5 to-cyan-500/5' },
  article: { icon: '📝', accent: 'border-l-emerald-500', label: 'Article', bg: 'from-emerald-500/5 to-teal-500/5' },
  report: { icon: '📊', accent: 'border-l-violet-500', label: 'Report', bg: 'from-violet-500/5 to-purple-500/5' },
  proposal: { icon: '📋', accent: 'border-l-amber-500', label: 'Proposal', bg: 'from-amber-500/5 to-orange-500/5' },
  resume: { icon: '👤', accent: 'border-l-rose-500', label: 'Resume', bg: 'from-rose-500/5 to-pink-500/5' },
  letter: { icon: '💌', accent: 'border-l-sky-500', label: 'Letter', bg: 'from-sky-500/5 to-indigo-500/5' },
  plan: { icon: '🗺️', accent: 'border-l-lime-500', label: 'Business Plan', bg: 'from-lime-500/5 to-green-500/5' },
  document: { icon: '📄', accent: 'border-l-primary', label: 'Document', bg: 'from-muted/10 to-muted/5' },
};

// Extract TOC from markdown
const extractTOC = (content: string): { level: number; text: string; id: string }[] => {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const text = match[2].replace(/\*\*/g, '').trim();
      headings.push({
        level: match[1].length,
        text,
        id: text.toLowerCase().replace(/[^\w]+/g, '-'),
      });
    }
  }
  return headings;
};

// Word count
const wordCount = (text: string): number => {
  return text.replace(/[#*`>\-\[\]()!]/g, '').split(/\s+/).filter(Boolean).length;
};

// Reading time
const readingTime = (text: string): number => {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
};

export const DocumentArtifact: React.FC<DocumentArtifactProps> = ({ title, content, type }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [activeView, setActiveView] = useState<'rendered' | 'raw'>('rendered');
  const docRef = useRef<HTMLDivElement>(null);

  const config = typeConfig[type] || typeConfig.document;
  const toc = useMemo(() => extractTOC(editedContent), [editedContent]);
  const words = useMemo(() => wordCount(editedContent), [editedContent]);
  const readTime = useMemo(() => readingTime(editedContent), [editedContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    toast({ title: 'Document copied to clipboard' });
  };

  const handleDownloadMd = () => {
    const blob = new Blob([editedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded as Markdown' });
  };

  const handleDownloadTxt = () => {
    const plainText = editedContent
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*+]\s/gm, '• ')
      .replace(/^>\s/gm, '');
    
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded as Text' });
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f0f17',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      toast({ title: 'Downloaded as PDF' });
    } catch {
      toast({ title: 'PDF export failed', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: Georgia, 'Times New Roman', serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; line-height: 1.8; }
        h1 { font-size: 28px; margin-bottom: 8px; } h2 { font-size: 22px; margin-top: 32px; } h3 { font-size: 18px; }
        p { margin: 12px 0; } ul, ol { padding-left: 24px; } blockquote { border-left: 3px solid #ddd; padding-left: 16px; color: #555; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
        pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
        th { background: #f8f8f8; font-weight: 600; }
        @media print { body { margin: 0; } }
      </style></head><body>
      ${docRef.current?.innerHTML || ''}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    toast({ title: 'Document updated' });
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`mt-3 rounded-xl border border-border/30 bg-gradient-to-br ${config.bg} overflow-hidden shadow-lg shadow-black/5 backdrop-blur-sm ${
        isExpanded ? 'fixed inset-4 z-50 m-0' : ''
      }`}
    >
      {/* Premium header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.bg} border border-border/20 flex items-center justify-center text-base`}>
            {config.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground leading-tight">{title}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground/40 font-mono">
                {words.toLocaleString()} words · {readTime} min read
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {/* View toggle */}
          {!isEditing && (
            <div className="flex items-center bg-muted/30 rounded-lg p-0.5 mr-1">
              <button
                onClick={() => setActiveView('rendered')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  activeView === 'rendered' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/50 hover:text-foreground'
                }`}
              >
                <BookOpen className="h-3 w-3" />
              </button>
              <button
                onClick={() => setActiveView('raw')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  activeView === 'raw' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/50 hover:text-foreground'
                }`}
              >
                <FileText className="h-3 w-3" />
              </button>
            </div>
          )}

          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleSaveEdit} className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300">
                <Check className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="h-7 px-2 text-xs text-red-400 hover:text-red-300">
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
            </>
          ) : (
            <>
              {toc.length > 2 && (
                <Button variant="ghost" size="sm" onClick={() => setShowTOC(!showTOC)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Table of Contents">
                  <List className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Edit">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Copy">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Print">
                <Printer className="h-3.5 w-3.5" />
              </Button>

              {/* Download dropdown */}
              <div className="relative group/dl">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border/30 rounded-lg shadow-xl opacity-0 invisible group-hover/dl:opacity-100 group-hover/dl:visible transition-all duration-200 z-50">
                  <button onClick={handleDownloadMd} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center gap-2 rounded-t-lg">
                    <FileText className="h-3 w-3" /> Markdown (.md)
                  </button>
                  <button onClick={handleDownloadTxt} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center gap-2">
                    <FileText className="h-3 w-3" /> Plain Text (.txt)
                  </button>
                  <button onClick={handleDownloadPdf} disabled={isExporting} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center gap-2 rounded-b-lg">
                    <FileDown className="h-3 w-3" /> PDF Document
                  </button>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title={isExpanded ? 'Minimize' : 'Expand'}>
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Table of Contents */}
      <AnimatePresence>
        {showTOC && toc.length > 2 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-border/20 bg-muted/10 overflow-hidden"
          >
            <div className="px-4 py-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Contents</h4>
              <nav className="flex flex-col gap-0.5">
                {toc.map((item, i) => (
                  <button
                    key={i}
                    className="text-left text-xs text-muted-foreground/70 hover:text-foreground transition-colors flex items-center gap-1"
                    style={{ paddingLeft: `${(item.level - 1) * 16}px` }}
                    onClick={() => {
                      setShowTOC(false);
                      // Scroll to heading
                      const el = document.getElementById(item.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <ChevronRight className="h-2.5 w-2.5 text-primary/40" />
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`${isExpanded ? 'overflow-y-auto max-h-[calc(100vh-120px)]' : 'max-h-[500px] overflow-y-auto'} custom-scrollbar`}>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[300px] p-6 bg-transparent text-sm text-foreground font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 rounded-b-xl"
            autoFocus
          />
        ) : activeView === 'raw' ? (
          <pre className="p-6 text-xs font-mono text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
            {editedContent}
          </pre>
        ) : (
          <div ref={docRef} className="px-6 py-6 sm:px-8 sm:py-8">
            {/* Document page styling */}
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-xl prose-h1:border-b prose-h1:border-border/30 prose-h1:pb-3 prose-h1:mb-4
              prose-h2:text-base prose-h2:mt-8 prose-h2:mb-3 prose-h2:first:mt-0
              prose-h3:text-sm prose-h3:mt-5
              prose-p:text-foreground/85 prose-p:leading-[1.8] prose-p:my-3
              prose-strong:text-foreground prose-strong:font-semibold
              prose-li:text-foreground/85 prose-li:leading-relaxed prose-li:my-0.5
              prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-2
              prose-blockquote:border-l-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
              prose-table:my-4 prose-th:bg-muted/40 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
              prose-hr:border-border/30 prose-hr:my-6
              prose-img:rounded-lg prose-img:shadow-lg
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')}>{children}</h1>,
                  h2: ({ children }) => <h2 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')}>{children}</h2>,
                  h3: ({ children }) => <h3 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')}>{children}</h3>,
                  // Task list support
                  li: ({ children, ...props }: any) => {
                    const text = String(children);
                    if (text.startsWith('☐ ') || text.startsWith('☑ ')) {
                      const checked = text.startsWith('☑');
                      return (
                        <li className="flex items-start gap-2 list-none -ml-5" {...props}>
                          <span className={`mt-1 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            checked ? 'bg-primary/20 border-primary/40 text-primary' : 'border-border/40'
                          }`}>
                            {checked && '✓'}
                          </span>
                          <span className={checked ? 'line-through opacity-60' : ''}>{text.slice(2)}</span>
                        </li>
                      );
                    }
                    return <li {...props}>{children}</li>;
                  },
                }}
              >
                {editedContent}
              </ReactMarkdown>
            </div>

            {/* Document footer */}
            <div className="mt-8 pt-4 border-t border-border/20 flex items-center justify-between text-[10px] text-muted-foreground/30 font-mono">
              <span>Generated by ShadowTalk AI</span>
              <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen overlay backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10" 
          onClick={() => setIsExpanded(false)} 
        />
      )}
    </motion.div>
  );
};

// Detect if AI response contains a document artifact
export function detectDocumentArtifact(content: string): { isDocument: boolean; title: string; type: DocumentArtifactProps['type']; documentContent: string } | null {
  if (!content || content.length < 200) return null;

  const documentPatterns: Array<{ regex: RegExp; type: DocumentArtifactProps['type']; titleExtractor: (match: RegExpMatchArray, content: string) => string }> = [
    {
      regex: /^(?:\*\*)?Subject[:\s]*(?:\*\*)?(.+?)(?:\n|$)/im,
      type: 'email',
      titleExtractor: (m) => m[1].trim().replace(/\*\*/g, ''),
    },
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Professional\s+Summary|Work\s+Experience|Education|Skills|Career\s+Objective)/im,
      type: 'resume',
      titleExtractor: (_m, c) => {
        const nameMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return nameMatch ? nameMatch[1].replace(/\*\*/g, '') : 'Resume';
      },
    },
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Executive\s+Summary)[\s\S]*?(?:##?\s*)?(?:Market\s+Analysis|Financial\s+Projections|Marketing\s+Strategy)/im,
      type: 'plan',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Business Plan';
      },
    },
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Executive\s+Summary)[\s\S]*?(?:##?\s*)?(?:Findings|Recommendations|Conclusion|Analysis)/im,
      type: 'report',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Report';
      },
    },
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Objective|Proposal\s+Overview|Project\s+Scope)[\s\S]*?(?:##?\s*)?(?:Timeline|Budget|Deliverables|Methodology)/im,
      type: 'proposal',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Proposal';
      },
    },
    {
      regex: /(?:Dear\s+(?:Mr\.|Mrs\.|Ms\.|Dr\.|Sir|Madam|Hiring|Team|Editor)|To\s+Whom\s+It\s+May\s+Concern)/im,
      type: 'letter',
      titleExtractor: (_m, c) => {
        const reMatch = c.match(/(?:Re|Subject|Regarding)[:\s]+(.+?)(?:\n|$)/im);
        return reMatch ? reMatch[1].trim() : 'Letter';
      },
    },
    {
      regex: /^#\s+.+\n[\s\S]*?(?:##\s+.+\n[\s\S]*?){2,}/m,
      type: 'article',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Article';
      },
    },
  ];

  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  const lines = content.split('\n').length;
  if (codeBlockCount > 0 && codeBlockCount >= lines / 10) return null;

  for (const pattern of documentPatterns) {
    const match = content.match(pattern.regex);
    if (match) {
      const title = pattern.titleExtractor(match, content);
      return {
        isDocument: true,
        title: title.length > 60 ? title.slice(0, 57) + '...' : title,
        type: pattern.type,
        documentContent: content,
      };
    }
  }

  const headerCount = (content.match(/^#{1,3}\s+/gm) || []).length;
  if (headerCount >= 3 && content.length > 500) {
    const titleMatch = content.match(/^#\s+(.+?)(?:\n|$)/m);
    return {
      isDocument: true,
      title: titleMatch ? titleMatch[1].replace(/\*\*/g, '').slice(0, 60) : 'Generated Document',
      type: 'document',
      documentContent: content,
    };
  }

  return null;
}
