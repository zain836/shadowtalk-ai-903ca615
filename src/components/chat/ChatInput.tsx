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
    <div className="border-t border-border/50 bg-gradient-to-t from-background to-transparent">
      <div className="max-w-4xl mx-auto px-2 py-2 md:px-4 md:py-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3 overflow-x-auto scrollbar-none">
          <ModeSelector 
            mode={chatMode} 
            onModeChange={(mode) => {
              onModeChange(mode);
              if (mode === 'image') {
                onOpenImageGenerator();
              }
            }}
            disabled={isLoading}
          />
          {chatMode === 'research' && (
            <SearchHistory onSelectQuery={(query) => onMessageChange(query)} />
          )}
          <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-muted-foreground shrink-0">
            {chatMode === 'research' && <Search className="h-3 w-3 text-violet-500" />}
            {chatMode === 'camera' && <Camera className="h-3 w-3 text-teal-500" />}
            {chatMode === 'organize' && <Table className="h-3 w-3 text-amber-500" />}
            {!['research', 'camera', 'organize'].includes(chatMode) && <Sparkles className="h-3 w-3" />}
            <span className="capitalize">{chatMode}</span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="capitalize hidden sm:inline">{personality}</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative flex items-end gap-1 md:gap-2 bg-card border border-border/50 rounded-xl md:rounded-2xl p-1.5 md:p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          {/* Left Actions */}
          <div className="flex items-center gap-0.5 md:gap-1 pb-0.5 md:pb-1 shrink-0">
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
            placeholder={isListening ? "Listening..." : `Message ShadowTalk AI...`}
            className={`flex-1 min-h-[40px] md:min-h-[44px] max-h-[120px] md:max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 md:py-3 px-1.5 md:px-2 text-sm ${
              isListening ? 'placeholder:text-primary' : ''
            }`}
            disabled={isLoading}
            rows={1}
          />
          
          {/* Right Actions */}
          <div className="flex items-center gap-0.5 md:gap-1 pb-0.5 md:pb-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onToggleVoice} 
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl ${isListening ? 'bg-primary text-primary-foreground' : ''}`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Hide image button on mobile to save space */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenImageGenerator}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl hidden sm:flex"
                    disabled={isLoading}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Generate image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {isLoading ? (
              <Button 
                onClick={onStopGeneration} 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={onSend} 
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-primary hover:bg-primary/90"
                disabled={!message.trim() && !selectedFile}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Helper text - hide on mobile */}
        <p className="text-[10px] text-muted-foreground text-center mt-1.5 md:mt-2 hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
