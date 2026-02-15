import { Send, Mic, MicOff, Square, Image as ImageIcon, Sparkles, Search, Camera, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/chat/FileUpload";
import { ModeSelector, ChatMode } from "@/components/chat/ModeSelector";
import { SearchHistory } from "@/components/chat/SearchHistory";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  onOpenImageGenerator: () => void;
  onStopGeneration: () => void;
  selectedFile: { type: 'image' | 'file'; data: string; name: string; mimeType: string } | null;
  onFileSelect: (file: { type: 'image' | 'file'; data: string; name: string; mimeType: string } | null) => void;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  personality: string;
}

export const ChatInput = ({
  message,
  onMessageChange,
  onSend,
  onKeyPress,
  isLoading,
  isListening,
  onToggleVoice,
  onOpenImageGenerator,
  onStopGeneration,
  selectedFile,
  onFileSelect,
  chatMode,
  onModeChange,
  personality,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border/20 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-3xl mx-auto px-3 py-3 md:px-4 md:py-4">
        {/* Mode Bar */}
        <div className="flex items-center gap-2 mb-2.5 overflow-x-auto scrollbar-none">
          <ModeSelector 
            mode={chatMode} 
            onModeChange={(mode) => {
              onModeChange(mode);
              if (mode === 'image') onOpenImageGenerator();
            }}
            disabled={isLoading}
          />
          {chatMode === 'research' && (
            <SearchHistory onSelectQuery={(query) => onMessageChange(query)} />
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 shrink-0 font-mono">
            {chatMode === 'research' && <Search className="h-3 w-3 text-violet-400" />}
            {chatMode === 'camera' && <Camera className="h-3 w-3 text-teal-400" />}
            {chatMode === 'organize' && <Table className="h-3 w-3 text-amber-400" />}
            {!['research', 'camera', 'organize'].includes(chatMode) && <Sparkles className="h-3 w-3 text-primary/50" />}
            <span className="capitalize">{chatMode}</span>
            <span className="hidden sm:inline opacity-40">·</span>
            <span className="capitalize hidden sm:inline">{personality}</span>
          </div>
        </div>

        {/* Input Container */}
        <div className="relative flex items-end gap-1.5 bg-card/80 backdrop-blur-sm rounded-2xl border border-border/40 p-1.5 md:p-2 shadow-lg shadow-black/5 focus-within:border-primary/30 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] transition-all duration-300">
          {/* Left: File Upload */}
          <div className="flex items-center pb-1 shrink-0">
            <FileUpload
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onClear={() => onFileSelect(null)}
              disabled={isLoading}
            />
          </div>
          
          {/* Textarea */}
          <Textarea 
            value={message} 
            onChange={(e) => onMessageChange(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Ask anything..."}
            className={`flex-1 min-h-[40px] md:min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-2 text-sm placeholder:text-muted-foreground/40 ${
              isListening ? 'placeholder:text-primary placeholder:animate-pulse' : ''
            }`}
            disabled={isLoading}
            rows={1}
          />
          
          {/* Right Actions */}
          <div className="flex items-center gap-1 pb-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onToggleVoice} 
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-xl transition-all duration-200 ${
                      isListening 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Voice input</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenImageGenerator}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex"
                    disabled={isLoading}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Generate image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isLoading ? (
              <Button 
                onClick={onStopGeneration} 
                size="icon" 
                className="h-8 w-8 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button 
                onClick={onSend} 
                size="icon"
                className="h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 disabled:opacity-30 disabled:shadow-none"
                disabled={!message.trim() && !selectedFile}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2 hidden sm:block font-mono">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
