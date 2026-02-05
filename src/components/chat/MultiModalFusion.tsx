import { useState, useCallback, useRef } from "react";
import { 
  Image, FileText, Mic, Code, Video, FileAudio,
  X, Upload, Camera, Paperclip, Plus, Sparkles,
  Eye, Brain, Wand2, Loader2, Check, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// =============================================================================
// MULTI-MODAL FUSION - Combine text, image, voice, code in one conversation
// =============================================================================
// Beats Claude by handling ALL modalities seamlessly in a single input
// =============================================================================

export interface ModalityItem {
  id: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'code' | 'voice';
  data: string | File;
  preview?: string;
  name?: string;
  mimeType?: string;
  size?: number;
  transcription?: string; // For audio/voice
  analysis?: string; // For images
  status: 'pending' | 'processing' | 'ready' | 'error';
}

interface MultiModalFusionProps {
  onSubmit: (items: ModalityItem[], textPrompt: string) => void;
  isProcessing?: boolean;
  maxItems?: number;
}

const MODALITY_CONFIG = {
  image: { icon: Image, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Image' },
  audio: { icon: FileAudio, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Audio' },
  video: { icon: Video, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Video' },
  file: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Document' },
  code: { icon: Code, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Code' },
  voice: { icon: Mic, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Voice' },
  text: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-500/10', label: 'Text' },
};

export const MultiModalFusion = ({ 
  onSubmit, 
  isProcessing = false,
  maxItems = 10 
}: MultiModalFusionProps) => {
  const [items, setItems] = useState<ModalityItem[]>([]);
  const [textPrompt, setTextPrompt] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (items.length >= maxItems) {
        toast({ title: 'Maximum items reached', variant: 'destructive' });
        return;
      }

      const type = getModalityType(file);
      const id = crypto.randomUUID();
      
      // Create preview for images
      let preview: string | undefined;
      if (type === 'image') {
        preview = URL.createObjectURL(file);
      }

      const newItem: ModalityItem = {
        id,
        type,
        data: file,
        preview,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        status: 'pending'
      };

      setItems(prev => [...prev, newItem]);
      
      // Auto-process the item
      processItem(newItem);
    });

    setShowPicker(false);
  }, [items.length, maxItems, toast]);

  // Determine modality type from file
  const getModalityType = (file: File): ModalityItem['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('javascript') || file.type.includes('typescript') || 
        file.name.match(/\.(js|ts|jsx|tsx|py|rb|go|rs|java|cpp|c|h)$/)) return 'code';
    return 'file';
  };

  // Process an item (analyze, transcribe, etc.)
  const processItem = useCallback(async (item: ModalityItem) => {
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, status: 'processing' } : i
    ));

    // Simulate processing (in real app, would call AI)
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

    setItems(prev => prev.map(i => {
      if (i.id !== item.id) return i;
      
      let analysis: string | undefined;
      let transcription: string | undefined;

      if (item.type === 'image') {
        analysis = 'Image analyzed: Contains visual elements ready for AI interpretation';
      } else if (item.type === 'audio' || item.type === 'voice') {
        transcription = 'Audio transcribed and ready for context';
      }

      return { ...i, status: 'ready', analysis, transcription };
    }));
  }, []);

  // Voice recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording and add voice item
      const id = crypto.randomUUID();
      setItems(prev => [...prev, {
        id,
        type: 'voice',
        data: 'voice-recording',
        name: 'Voice Recording',
        status: 'processing'
      }]);
      
      // Simulate transcription
      setTimeout(() => {
        setItems(prev => prev.map(i => 
          i.id === id ? { ...i, status: 'ready', transcription: 'Voice transcribed' } : i
        ));
      }, 1500);
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        toast({ title: 'Recording started', description: 'Click again to stop' });
      } catch (e) {
        toast({ title: 'Microphone access denied', variant: 'destructive' });
      }
    }
  }, [isRecording, toast]);

  // Remove an item
  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (items.length === 0 && !textPrompt.trim()) {
      toast({ title: 'Add content or type a message', variant: 'destructive' });
      return;
    }
    onSubmit(items, textPrompt);
    setItems([]);
    setTextPrompt('');
  }, [items, textPrompt, onSubmit, toast]);

  const readyCount = items.filter(i => i.status === 'ready').length;
  const processingCount = items.filter(i => i.status === 'processing').length;

  return (
    <div className="space-y-3">
      {/* Items grid */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/50 border"
          >
            {items.map((item) => {
              const config = MODALITY_CONFIG[item.type];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    "relative group flex items-center gap-2 px-3 py-2 rounded-lg border",
                    config.bg,
                    item.status === 'error' && 'border-destructive'
                  )}
                >
                  {/* Preview or icon */}
                  {item.preview ? (
                    <img src={item.preview} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className={cn("w-8 h-8 rounded flex items-center justify-center", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate max-w-[100px]">
                      {item.name || config.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {item.status === 'processing' && 'Processing...'}
                      {item.status === 'ready' && '✓ Ready'}
                      {item.status === 'error' && 'Error'}
                      {item.status === 'pending' && 'Pending'}
                    </span>
                  </div>

                  {/* Status indicator */}
                  <div className="w-4 h-4 flex items-center justify-center">
                    {item.status === 'processing' && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    {item.status === 'ready' && (
                      <Check className="h-3 w-3 text-emerald-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </motion.div>
              );
            })}

            {/* Summary */}
            {items.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                {processingCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {processingCount} processing
                  </span>
                )}
                {readyCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {readyCount} ready
                  </Badge>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Add modality button */}
        <TooltipProvider>
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPicker(!showPicker)}
                  className="shrink-0"
                  disabled={isProcessing}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add content</TooltipContent>
            </Tooltip>

            {/* Modality picker */}
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full mb-2 left-0 p-2 rounded-xl bg-popover border shadow-xl z-50 min-w-[200px]"
                >
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    Add to conversation
                  </div>
                  <div className="space-y-1">
                    {/* Image */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current!.accept = 'image/*';
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Image className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Image</span>
                    </button>

                    {/* Document */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current!.accept = '.pdf,.doc,.docx,.txt,.md';
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Document</span>
                    </button>

                    {/* Code */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current!.accept = '.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.cpp,.c,.h,.json,.yaml,.yml';
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Code className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">Code File</span>
                    </button>

                    {/* Audio */}
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        fileInputRef.current!.accept = 'audio/*';
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileAudio className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Audio File</span>
                    </button>

                    {/* Voice */}
                    <button
                      onClick={() => {
                        setShowPicker(false);
                        toggleRecording();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Mic className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Record Voice</span>
                    </button>

                    {/* Camera */}
                    <button
                      onClick={() => {
                        // Would open camera capture
                        toast({ title: 'Camera capture', description: 'Opening camera...' });
                        setShowPicker(false);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Camera className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm">Take Photo</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TooltipProvider>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
            <span className="text-xs text-red-500 font-medium">Recording...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRecording}
              className="h-6 px-2 text-xs"
            >
              Stop
            </Button>
          </motion.div>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder={items.length > 0 
              ? "Add context about your files..." 
              : "Type a message or add content..."
            }
            className="w-full min-h-[44px] max-h-[120px] px-4 py-2.5 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={1}
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        {/* Submit button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || (items.length === 0 && !textPrompt.trim()) || processingCount > 0}
                className="shrink-0 gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {items.length > 0 ? `Send ${items.length} items` : 'Send'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {processingCount > 0 ? 'Wait for processing...' : 'Send message'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Fusion indicator */}
      {items.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-primary/70"
        >
          <Brain className="h-3 w-3" />
          <span>Multi-Modal Fusion: AI will analyze all {items.length} items together for comprehensive understanding</span>
        </motion.div>
      )}
    </div>
  );
};

export default MultiModalFusion;
