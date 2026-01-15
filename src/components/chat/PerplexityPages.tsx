import { useState, useEffect } from "react";
import { X, Globe, Copy, Check, Download, Share2, FileText, ExternalLink, Sparkles, Palette, Eye, Code, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface PerplexityPagesProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  conversationTitle?: string;
}

type PageTheme = 'minimal' | 'professional' | 'creative' | 'dark' | 'academic';

const themes: { value: PageTheme; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: 'Clean, distraction-free layout' },
  { value: 'professional', label: 'Professional', description: 'Business-ready styling' },
  { value: 'creative', label: 'Creative', description: 'Bold colors and dynamic design' },
  { value: 'dark', label: 'Dark Mode', description: 'Easy on the eyes' },
  { value: 'academic', label: 'Academic', description: 'Research paper style' },
];

export const PerplexityPages = ({ isOpen, onClose, messages, conversationTitle }: PerplexityPagesProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(conversationTitle || "Untitled Research");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [theme, setTheme] = useState<PageTheme>('professional');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showUserQuestions, setShowUserQuestions] = useState(true);
  const [extractedCitations, setExtractedCitations] = useState<string[]>([]);
  const [customCSS, setCustomCSS] = useState("");
  const [generatedHTML, setGeneratedHTML] = useState("");
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'code'>('edit');
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Extract citations from messages
  useEffect(() => {
    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const citations: string[] = [];
    
    messages.forEach(msg => {
      if (msg.type === 'ai') {
        const matches = msg.content.match(urlRegex);
        if (matches) {
          matches.forEach(url => {
            if (!citations.includes(url)) {
              citations.push(url);
            }
          });
        }
      }
    });
    
    setExtractedCitations(citations);
  }, [messages]);

  const getThemeStyles = (t: PageTheme): string => {
    const styles: Record<PageTheme, string> = {
      minimal: `
        body { font-family: 'Inter', system-ui, sans-serif; background: #fafafa; color: #1a1a1a; line-height: 1.8; }
        .container { max-width: 720px; margin: 0 auto; padding: 4rem 2rem; }
        h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .subtitle { color: #666; font-size: 1.1rem; margin-bottom: 2rem; }
        .meta { color: #999; font-size: 0.9rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
        .message { margin-bottom: 2rem; }
        .ai-message { padding: 1.5rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .user-message { padding: 1rem; background: #f0f0f0; border-radius: 8px; margin-bottom: 1rem; font-style: italic; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }
        pre { background: #1a1a2e; color: #eee; padding: 1rem; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 3px solid #ddd; padding-left: 1rem; margin: 1rem 0; color: #666; }
        .citations { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #eee; }
        .citations h2 { font-size: 1.2rem; margin-bottom: 1rem; }
        .citation-list { list-style: none; padding: 0; }
        .citation-list li { padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
        .citation-list a { color: #0066cc; text-decoration: none; }
        .citation-list a:hover { text-decoration: underline; }
      `,
      professional: `
        body { font-family: 'Georgia', serif; background: white; color: #333; line-height: 1.9; }
        .container { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
        h1 { font-family: 'Inter', sans-serif; font-size: 2.8rem; font-weight: 800; margin-bottom: 0.5rem; color: #1a1a1a; }
        .subtitle { color: #555; font-size: 1.2rem; margin-bottom: 2rem; font-style: italic; }
        .meta { color: #888; font-size: 0.95rem; border-bottom: 2px solid #eee; padding-bottom: 1.5rem; margin-bottom: 2.5rem; }
        .message { margin-bottom: 2.5rem; }
        .ai-message { padding: 2rem; background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%); border-radius: 12px; border: 1px solid #e5e7eb; }
        .user-message { padding: 1.25rem; background: #f1f5f9; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6; }
        code { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; }
        pre { background: #1e293b; color: #e2e8f0; padding: 1.5rem; border-radius: 10px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #3b82f6; padding-left: 1.5rem; margin: 1.5rem 0; color: #64748b; background: #f8fafc; padding: 1rem 1.5rem; border-radius: 0 8px 8px 0; }
        .citations { margin-top: 4rem; padding-top: 2rem; border-top: 2px solid #e5e7eb; }
        .citations h2 { font-family: 'Inter', sans-serif; font-size: 1.4rem; margin-bottom: 1.5rem; }
        .citation-list { list-style: decimal; padding-left: 1.5rem; }
        .citation-list li { padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; }
        .citation-list a { color: #2563eb; text-decoration: none; font-size: 0.95rem; }
        .citation-list a:hover { text-decoration: underline; }
      `,
      creative: `
        body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; padding: 4rem 2rem; }
        .content-wrapper { background: rgba(255,255,255,0.95); padding: 3rem; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { color: #6b7280; font-size: 1.15rem; margin-bottom: 2rem; }
        .meta { color: #9ca3af; font-size: 0.9rem; padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 2px dashed #e5e7eb; }
        .message { margin-bottom: 2rem; }
        .ai-message { padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid transparent; background-image: linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2); background-origin: border-box; background-clip: padding-box, border-box; }
        .user-message { padding: 1.25rem; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 12px; margin-bottom: 1.5rem; }
        code { background: #faf5ff; color: #7c3aed; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.9rem; }
        pre { background: #1f2937; color: #f3f4f6; padding: 1.5rem; border-radius: 12px; }
        pre code { background: none; color: #f3f4f6; }
        blockquote { border-left: 4px solid #8b5cf6; padding: 1rem 1.5rem; background: #faf5ff; border-radius: 0 12px 12px 0; margin: 1.5rem 0; }
        .citations { margin-top: 3rem; padding-top: 2rem; border-top: 2px dashed #e5e7eb; }
        .citations h2 { font-size: 1.3rem; color: #667eea; margin-bottom: 1.5rem; }
        .citation-list { list-style: none; padding: 0; }
        .citation-list li { padding: 0.75rem 1rem; background: #faf5ff; border-radius: 8px; margin-bottom: 0.5rem; }
        .citation-list a { color: #7c3aed; text-decoration: none; }
      `,
      dark: `
        body { font-family: 'Inter', system-ui, sans-serif; background: #0f0f0f; color: #e5e5e5; line-height: 1.8; }
        .container { max-width: 760px; margin: 0 auto; padding: 4rem 2rem; }
        h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff; }
        .subtitle { color: #a3a3a3; font-size: 1.1rem; margin-bottom: 2rem; }
        .meta { color: #737373; font-size: 0.9rem; border-bottom: 1px solid #262626; padding-bottom: 1rem; margin-bottom: 2rem; }
        .message { margin-bottom: 2rem; }
        .ai-message { padding: 1.5rem; background: #171717; border-radius: 12px; border: 1px solid #262626; }
        .user-message { padding: 1rem; background: #1f1f1f; border-radius: 8px; margin-bottom: 1rem; color: #a3a3a3; }
        code { background: #262626; color: #22d3ee; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9rem; }
        pre { background: #000; color: #e5e5e5; padding: 1.25rem; border-radius: 10px; border: 1px solid #262626; }
        pre code { background: none; }
        blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; color: #a3a3a3; }
        a { color: #60a5fa; }
        .citations { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #262626; }
        .citations h2 { font-size: 1.2rem; margin-bottom: 1rem; color: #fff; }
        .citation-list { list-style: none; padding: 0; }
        .citation-list li { padding: 0.6rem 0; border-bottom: 1px solid #1f1f1f; }
        .citation-list a { color: #60a5fa; text-decoration: none; }
      `,
      academic: `
        body { font-family: 'Times New Roman', serif; background: #fffef8; color: #1a1a1a; line-height: 2; font-size: 12pt; }
        .container { max-width: 700px; margin: 0 auto; padding: 3rem 2rem; }
        h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 1rem; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; }
        .subtitle { text-align: center; font-style: italic; color: #444; margin-bottom: 1rem; }
        .meta { text-align: center; color: #666; font-size: 0.95rem; border-bottom: 1px solid #ddd; padding-bottom: 1.5rem; margin-bottom: 2rem; }
        .abstract { padding: 1rem; background: #f8f7f0; margin-bottom: 2rem; border: 1px solid #e5e4dd; }
        .abstract-title { font-weight: bold; margin-bottom: 0.5rem; }
        .message { margin-bottom: 1.5rem; text-align: justify; }
        .ai-message { padding: 0; }
        .user-message { padding: 0.75rem 1rem; background: #f5f4ed; margin-bottom: 1rem; font-style: italic; border-left: 2px solid #999; }
        code { font-family: 'Courier New', monospace; background: #f0efe8; padding: 0.15rem 0.3rem; font-size: 0.95rem; }
        pre { background: #f0efe8; padding: 1rem; border: 1px solid #ddd; overflow-x: auto; font-family: 'Courier New', monospace; }
        pre code { background: none; padding: 0; }
        blockquote { margin: 1rem 2rem; padding-left: 1rem; border-left: 2px solid #999; color: #555; font-style: italic; }
        .citations { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #ddd; }
        .citations h2 { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
        .citation-list { list-style: none; padding: 0; }
        .citation-list li { padding: 0.4rem 0; text-indent: -2rem; padding-left: 2rem; }
        .citation-list a { color: #1a1a1a; }
      `,
    };
    return styles[t];
  };

  const generatePage = () => {
    const filteredMessages = messages.filter(m => {
      if (m.id === 'welcome') return false;
      if (!showUserQuestions && m.type === 'user') return false;
      return true;
    });

    const formatContent = (content: string) => {
      // Convert markdown to HTML (simple version)
      return content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/\n/g, '<br>');
    };

    const messagesHTML = filteredMessages.map(msg => {
      const timestamp = showTimestamps 
        ? `<span class="timestamp">${msg.timestamp.toLocaleString()}</span>`
        : '';
      
      return msg.type === 'user'
        ? `<div class="message user-message">${formatContent(msg.content)}${timestamp}</div>`
        : `<div class="message ai-message">${formatContent(msg.content)}${timestamp}</div>`;
    }).join('\n');

    const citationsHTML = extractedCitations.length > 0 ? `
      <div class="citations">
        <h2>References</h2>
        <ol class="citation-list">
          ${extractedCitations.map((url, i) => `<li><a href="${url}" target="_blank" rel="noopener">[${i + 1}] ${url}</a></li>`).join('\n')}
        </ol>
      </div>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${subtitle || 'Research generated with ShadowTalk AI'}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${subtitle || 'Research generated with ShadowTalk AI'}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${getThemeStyles(theme)}
    ${customCSS}
  </style>
</head>
<body>
  <div class="container">
    ${theme === 'creative' ? '<div class="content-wrapper">' : ''}
    <header>
      <h1>${title}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
      <div class="meta">
        ${author ? `By ${author} • ` : ''}Generated with ShadowTalk AI • ${new Date().toLocaleDateString()}
      </div>
    </header>
    <main>
      ${messagesHTML}
    </main>
    ${citationsHTML}
    ${theme === 'creative' ? '</div>' : ''}
  </div>
</body>
</html>`;

    setGeneratedHTML(html);
    return html;
  };

  useEffect(() => {
    if (isOpen) {
      generatePage();
    }
  }, [isOpen, title, subtitle, author, theme, showTimestamps, showUserQuestions, customCSS, messages]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedHTML);
    setCopied(true);
    toast({ title: "HTML copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Page downloaded" });
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Simulate publishing - in real implementation this would upload to a hosting service
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUrl = `https://pages.shadowtalk.ai/${crypto.randomUUID().slice(0, 8)}`;
      setPageUrl(mockUrl);
      toast({ title: "Page published!", description: "Your page is now live." });
    } catch (error) {
      toast({ title: "Publishing failed", variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const copyPageUrl = async () => {
    await navigator.clipboard.writeText(pageUrl);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Create Shareable Page
          </DialogTitle>
        </DialogHeader>

        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'edit' | 'preview' | 'code')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="edit" className="gap-2">
              <FileText className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 overflow-y-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Page Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter page title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle (optional)</Label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="A brief description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Author (optional)</Label>
                  <Input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name..."
                  />
                </div>
              </div>

              {/* Theme & Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={(v) => setTheme(v as PageTheme)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{t.label}</span>
                            <span className="text-xs text-muted-foreground">{t.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-questions">Include user questions</Label>
                    <Switch
                      id="show-questions"
                      checked={showUserQuestions}
                      onCheckedChange={setShowUserQuestions}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-timestamps">Show timestamps</Label>
                    <Switch
                      id="show-timestamps"
                      checked={showTimestamps}
                      onCheckedChange={setShowTimestamps}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom CSS */}
            <div className="mt-6 space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Custom CSS (optional)
              </Label>
              <Textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder="/* Add custom styles here */"
                className="font-mono text-sm h-24"
              />
            </div>

            {/* Citations Preview */}
            {extractedCitations.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Extracted Citations ({extractedCitations.length})
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                  {extractedCitations.slice(0, 5).map((url, i) => (
                    <li key={i} className="truncate">
                      <a href={url} target="_blank" rel="noopener" className="hover:text-primary">
                        {url}
                      </a>
                    </li>
                  ))}
                  {extractedCitations.length > 5 && (
                    <li className="text-muted-foreground">+ {extractedCitations.length - 5} more...</li>
                  )}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <div className="h-[500px] border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={generatedHTML}
                className="w-full h-full"
                title="Page Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-hidden mt-4">
            <div className="relative h-[500px]">
              <pre className="h-full overflow-auto p-4 bg-muted rounded-lg text-sm font-mono">
                <code>{generatedHTML}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Published URL */}
        {pageUrl && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <ExternalLink className="h-4 w-4 text-green-500" />
            <span className="text-sm flex-1 truncate">{pageUrl}</span>
            <Button size="sm" variant="ghost" onClick={copyPageUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={pageUrl} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download HTML
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing} className="gap-2">
              {isPublishing ? (
                <>Publishing...</>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Publish Page
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
