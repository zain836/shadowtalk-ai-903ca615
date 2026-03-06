import React, { useState, useRef } from 'react';
import { FileText, Download, Edit3, Check, X, Copy, Maximize2, Minimize2, FileDown } from 'lucide-react';
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

export const DocumentArtifact: React.FC<DocumentArtifactProps> = ({ title, content, type }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const displayContent = isEditing ? editedContent : editedContent;

  const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    email: { icon: '✉️', color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', label: 'Email' },
    article: { icon: '📝', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30', label: 'Article' },
    report: { icon: '📊', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30', label: 'Report' },
    proposal: { icon: '📋', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30', label: 'Proposal' },
    resume: { icon: '👤', color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30', label: 'Resume' },
    letter: { icon: '💌', color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/30', label: 'Letter' },
    plan: { icon: '🗺️', color: 'from-lime-500/20 to-green-500/20 border-lime-500/30', label: 'Business Plan' },
    document: { icon: '📄', color: 'from-slate-500/20 to-gray-500/20 border-slate-500/30', label: 'Document' },
  };

  const config = typeConfig[type] || typeConfig.document;

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
    // Strip markdown for plain text
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
        backgroundColor: '#1a1a2e',
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
      className={`mt-3 rounded-xl border bg-gradient-to-br ${config.color} overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50 m-0' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium uppercase tracking-wider">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
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
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Edit">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Copy">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadMd} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Download .md">
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadTxt} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Download .txt">
                <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadPdf} disabled={isExporting} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title="Download PDF">
                <FileDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" title={isExpanded ? 'Minimize' : 'Expand'}>
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'overflow-y-auto max-h-[calc(100vh-120px)]' : 'max-h-[400px] overflow-y-auto'} custom-scrollbar`}>
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[300px] p-4 bg-transparent text-sm text-foreground font-mono resize-y focus:outline-none focus:ring-1 focus:ring-primary/30 rounded-b-xl"
            autoFocus
          />
        ) : (
          <div ref={docRef} className="p-4 sm:p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90 prose-a:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
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

  // Patterns that indicate a structured document was generated
  const documentPatterns: Array<{ regex: RegExp; type: DocumentArtifactProps['type']; titleExtractor: (match: RegExpMatchArray, content: string) => string }> = [
    // Email detection
    {
      regex: /^(?:\*\*)?Subject[:\s]*(?:\*\*)?(.+?)(?:\n|$)/im,
      type: 'email',
      titleExtractor: (m) => m[1].trim().replace(/\*\*/g, ''),
    },
    // Resume/CV
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Professional\s+Summary|Work\s+Experience|Education|Skills|Career\s+Objective)/im,
      type: 'resume',
      titleExtractor: (_m, c) => {
        const nameMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return nameMatch ? nameMatch[1].replace(/\*\*/g, '') : 'Resume';
      },
    },
    // Business Plan
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Executive\s+Summary)[\s\S]*?(?:##?\s*)?(?:Market\s+Analysis|Financial\s+Projections|Marketing\s+Strategy)/im,
      type: 'plan',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Business Plan';
      },
    },
    // Report (has Executive Summary + Findings/Recommendations)
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Executive\s+Summary)[\s\S]*?(?:##?\s*)?(?:Findings|Recommendations|Conclusion|Analysis)/im,
      type: 'report',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Report';
      },
    },
    // Proposal
    {
      regex: /(?:^|\n)(?:##?\s*)?(?:Objective|Proposal\s+Overview|Project\s+Scope)[\s\S]*?(?:##?\s*)?(?:Timeline|Budget|Deliverables|Methodology)/im,
      type: 'proposal',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Proposal';
      },
    },
    // Letter
    {
      regex: /(?:Dear\s+(?:Mr\.|Mrs\.|Ms\.|Dr\.|Sir|Madam|Hiring|Team|Editor)|To\s+Whom\s+It\s+May\s+Concern)/im,
      type: 'letter',
      titleExtractor: (_m, c) => {
        const reMatch = c.match(/(?:Re|Subject|Regarding)[:\s]+(.+?)(?:\n|$)/im);
        return reMatch ? reMatch[1].trim() : 'Letter';
      },
    },
    // Article/Blog (has title + multiple ## sections + 500+ chars)
    {
      regex: /^#\s+.+\n[\s\S]*?(?:##\s+.+\n[\s\S]*?){2,}/m,
      type: 'article',
      titleExtractor: (_m, c) => {
        const titleMatch = c.match(/^#\s+(.+?)(?:\n|$)/m);
        return titleMatch ? titleMatch[1].replace(/\*\*/g, '') : 'Article';
      },
    },
  ];

  // Check if content has code blocks — if majority is code, skip document detection
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

  // Generic long-form document detection (3+ headers, 500+ chars, no code dominance)
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
