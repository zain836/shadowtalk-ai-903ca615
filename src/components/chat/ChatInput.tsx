import { Send, Mic, MicOff, Square, Image as ImageIcon, Sparkles, Search } from "lucide-react";
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
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Mode Selector */}
        <div className="flex items-center gap-3 mb-3">
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {chatMode === 'research' && <Search className="h-3 w-3 text-violet-500" />}
            {chatMode !== 'research' && <Sparkles className="h-3 w-3" />}
            <span className="capitalize">{chatMode}</span>
            <span className="text-border">•</span>
            <span className="capitalize">{personality}</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative flex items-end gap-2 bg-card border border-border/50 rounded-2xl p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          {/* Left Actions */}
          <div className="flex items-center gap-1 pb-1">
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
            className={`flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-2 text-sm ${
              isListening ? 'placeholder:text-primary' : ''
            }`}
            disabled={isLoading}
            rows={1}
          />
          
          {/* Right Actions */}
          <div className="flex items-center gap-1 pb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={onToggleVoice} 
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-xl ${isListening ? 'bg-primary text-primary-foreground' : ''}`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenImageGenerator}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl"
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
                className="h-9 w-9 rounded-xl"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={onSend} 
                size="icon"
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90"
                disabled={!message.trim() && !selectedFile}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
