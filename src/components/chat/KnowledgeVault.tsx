import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Upload, FileText, Trash2, Search, 
  Database, HardDrive, X, ChevronDown, ChevronUp,
  File, FileCode, FileJson, FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKnowledgeVault, VaultDocument } from '@/hooks/useKnowledgeVault';
import { cn } from '@/lib/utils';

interface KnowledgeVaultProps {
  isOpen: boolean;
  onClose: () => void;
  onContextReady?: (contextFn: (query: string) => string) => void;
}

const getFileIcon = (type: string, name: string) => {
  if (name.endsWith('.json')) return <FileJson className="h-4 w-4 text-amber-500" />;
  if (name.endsWith('.csv') || name.endsWith('.xlsx')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.py')) return <FileCode className="h-4 w-4 text-blue-500" />;
  if (type.startsWith('text/')) return <FileText className="h-4 w-4 text-primary" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({
  isOpen,
  onClose,
  onContextReady,
}) => {
  const {
    documents,
    isProcessing,
    progress,
    stage,
    totalChunks,
    error,
    initialize,
    addFiles,
    search,
    getContext,
    removeDocument,
    clearVault,
  } = useKnowledgeVault();

  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Expose context function to parent
  useEffect(() => {
    if (onContextReady && documents.length > 0) {
      onContextReady(getContext);
    }
  }, [documents, getContext, onContextReady]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await addFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await addFiles(files);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = search(searchQuery);
    setSearchResults(results);
    setShowResults(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[380px] z-50 glass-strong border-l border-border/40 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-sm">Knowledge Vault</h2>
            <Badge variant="outline" className="text-[10px] h-5">
              {documents.length} docs • {totalChunks} chunks
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drag-and-drop zone */}
        <div
          className={cn(
            'mx-4 mt-4 p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center',
            isDragOver
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-border/40 hover:border-primary/40 hover:bg-muted/30',
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.csv,.json,.xml,.html,.py,.js,.ts,.tsx,.jsx,.css,.yaml,.yml,.log,.env,.sh"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={cn('h-8 w-8 mx-auto mb-2', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
          <p className="text-sm font-medium">
            {isDragOver ? 'Drop files here' : 'Drag & drop files or folders'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .txt, .md, .csv, .json, .py, .js, .ts and more
          </p>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex justify-between text-xs mb-1">
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mx-4 mt-3 flex gap-2">
          <Input
            placeholder="Search your knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button size="sm" variant="outline" onClick={handleSearch} className="h-8 px-3">
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="mx-4 mt-2 p-3 rounded-lg bg-muted/50 border border-border/40 max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">{searchResults.length} results</p>
              <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="h-5 px-1">
                <ChevronUp className="h-3 w-3" />
              </Button>
            </div>
            {searchResults.map((result, i) => (
              <div key={i} className="text-xs text-muted-foreground p-2 rounded bg-background/50 mb-1 leading-relaxed">
                {result.slice(0, 200)}...
              </div>
            ))}
          </div>
        )}

        {/* Document List */}
        <ScrollArea className="flex-1 px-4 mt-3">
          <div className="space-y-2 pb-4">
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No documents yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Add files for instant, private local RAG
                </p>
              </div>
            ) : (
              documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  {getFileIcon(doc.type, doc.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatSize(doc.size)} • {doc.chunks.length} chunks
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeDocument(doc.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {documents.length > 0 && (
          <div className="p-4 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {formatSize(documents.reduce((sum, d) => sum + d.size, 0))} stored locally
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={clearVault}
            >
              Clear All
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
