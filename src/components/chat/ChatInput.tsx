import { Send, Mic, MicOff, Square, Image as ImageIcon, Sparkles, Search, Camera, Table, Command } from "lucide-react";
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
    <div className="relative border-t border-border/10">
      {/* Gradient fade above input */}
      <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      
      <div className="max-w-3xl mx-auto px-3 py-3 md:px-4 md:py-4">
        {/* Mode Bar */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-none">
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
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 shrink-0 font-mono ml-auto">
            {chatMode === 'research' && <Search className="h-3 w-3 text-violet-400" />}
            {chatMode === 'camera' && <Camera className="h-3 w-3 text-teal-400" />}
            {chatMode === 'organize' && <Table className="h-3 w-3 text-amber-400" />}
            {!['research', 'camera', 'organize'].includes(chatMode) && <Sparkles className="h-3 w-3 text-primary/40" />}
            <span className="capitalize">{chatMode}</span>
            <span className="hidden sm:inline opacity-30">·</span>
            <span className="capitalize hidden sm:inline">{personality}</span>
          </div>
        </div>

        {/* Input Container — Sovereign glassmorphism */}
        <div className="relative group">
          {/* Glow effect on focus */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-500" />
          
          <div className="relative flex items-end gap-1.5 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-2 shadow-xl shadow-black/10 group-focus-within:border-primary/25 group-focus-within:shadow-primary/5 transition-all duration-300">
            {/* Left: File Upload */}
            <div className="flex items-center pb-0.5 shrink-0">
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
              className={`flex-1 min-h-[42px] md:min-h-[46px] max-h-[180px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 px-2 text-sm placeholder:text-muted-foreground/35 ${
                isListening ? 'placeholder:text-primary placeholder:animate-pulse' : ''
              }`}
              disabled={isLoading}
              rows={1}
            />
            
            {/* Right Actions */}
            <div className="flex items-center gap-1 pb-0.5 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onToggleVoice} 
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 rounded-xl transition-all duration-200 ${
                        isListening 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                          : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50'
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
                      className="h-8 w-8 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 hidden sm:flex"
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
                  className="h-9 w-9 rounded-xl bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button 
                  onClick={onSend} 
                  size="icon"
                  className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200 disabled:opacity-20 disabled:shadow-none hover:scale-105 active:scale-95"
                  disabled={!message.trim() && !selectedFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground/30 font-mono">
          <span className="hidden sm:inline">Enter to send · Shift+Enter for new line</span>
          <span className="sm:hidden">Tap send or press Enter</span>
        </div>
      </div>
    </div>
  );
};
