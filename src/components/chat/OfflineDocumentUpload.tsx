import { useState, useRef, useCallback } from "react";
import { 
  FileText, Upload, X, Loader2, CheckCircle, 
  AlertTriangle, Trash2, Search, FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useOfflineChat } from "@/hooks/useOfflineChat";
import { useOfflineRAG } from "@/hooks/useOfflineRAG";
import { useToast } from "@/hooks/use-toast";

interface OfflineDocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  status: 'processing' | 'ready' | 'error';
  error?: string;
}

export const OfflineDocumentUpload = ({ isOpen, onClose }: OfflineDocumentUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const offlineChat = useOfflineChat();
  const rag = useOfflineRAG();

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Extract text from file
  const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'txt' || extension === 'md' || extension === 'csv') {
      return await file.text();
    }
    
    // For other file types, we'll use basic text extraction
    // In production, you'd want to use pdf.js or similar
    if (extension === 'json') {
      const json = await file.text();
      try {
        return JSON.stringify(JSON.parse(json), null, 2);
      } catch {
        return json;
      }
    }
    
    // Fallback: try to read as text
    try {
      return await file.text();
    } catch {
      throw new Error(`Unable to extract text from ${extension} files`);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const totalFiles = files.length;
    let processed = 0;

    for (const file of Array.from(files)) {
      const docId = crypto.randomUUID();
      
      // Add to list as processing
      setUploadedDocs(prev => [...prev, {
        id: docId,
        name: file.name,
        size: file.size,
        status: 'processing'
      }]);

      try {
        // Extract text
        const text = await extractTextFromFile(file);
        
        if (text.length < 50) {
          throw new Error('File content too short or empty');
        }

        // Split into chunks for better RAG performance
        const chunks = splitIntoChunks(text, 500);
        
        // Add each chunk to RAG
        for (let i = 0; i < chunks.length; i++) {
          await rag.addDocument(chunks[i], `${docId}-chunk-${i}`, {
            source: file.name,
            chunkIndex: i,
            totalChunks: chunks.length
          });
        }

        // Mark as ready
        setUploadedDocs(prev => prev.map(d => 
          d.id === docId ? { ...d, status: 'ready' as const } : d
        ));

        toast({
          title: "Document added",
          description: `${file.name} is now available for offline analysis`
        });

      } catch (error: any) {
        console.error('Document processing error:', error);
        setUploadedDocs(prev => prev.map(d => 
          d.id === docId ? { ...d, status: 'error' as const, error: error.message } : d
        ));
      }

      processed++;
      setProcessingProgress(Math.round((processed / totalFiles) * 100));
    }

    setIsProcessing(false);
    setProcessingProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Split text into chunks
  const splitIntoChunks = (text: string, maxWords: number): string[] => {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    
    return chunks;
  };

  // Remove document
  const removeDocument = async (docId: string) => {
    await rag.deleteDocument(docId);
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    toast({ title: "Document removed" });
  };

  // Clear all documents
  const clearAllDocuments = async () => {
    await rag.clearAll();
    setUploadedDocs([]);
    toast({ title: "All documents cleared" });
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Offline Document Vault
          </DialogTitle>
          <DialogDescription>
            Upload documents for private, offline analysis with AI. All data stays on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div 
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium mb-1">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: TXT, MD, CSV, JSON
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing documents...</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}

          {/* Uploaded Documents */}
          {uploadedDocs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Uploaded Documents</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllDocuments}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {uploadedDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {doc.status === 'ready' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {doc.status === 'error' && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-muted/20 rounded-md">
            <span>Documents in knowledge base:</span>
            <Badge variant="secondary">{rag.documentCount}</Badge>
          </div>

          {/* Info */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">
              <strong>🔒 Zero-Cloud Privacy:</strong> All documents are processed and stored locally using AI embeddings. 
              When you ask questions, the AI will cite specific sections from your documents.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
