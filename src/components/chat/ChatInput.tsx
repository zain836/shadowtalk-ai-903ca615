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
    <div className="relative border-t border-transparent bg-background/20 backdrop-blur-sm">
      {/* Soft gradient fade above input area */}
      <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
        {/* Sleek Mode Chips above input */}
        <div className="flex items-center gap-2 mb-3.5 overflow-x-auto scrollbar-none px-1">
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
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/35 shrink-0 font-mono ml-auto">
            {chatMode === 'research' && <Search className="h-3 w-3 text-blue-400" />}
            {chatMode === 'camera' && <Camera className="h-3 w-3 text-teal-400" />}
            {chatMode === 'organize' && <Table className="h-3 w-3 text-amber-400" />}
            {!['research', 'camera', 'organize'].includes(chatMode) && <Sparkles className="h-3 w-3 text-primary/30" />}
            <span className="capitalize">{chatMode}</span>
            <span className="opacity-25">·</span>
            <span className="capitalize">{personality}</span>
          </div>
        </div>

        {/* Input Bar — Gemini Rounded Pill */}
        <div className="relative group">
          {/* Subtle Outer Focus Glow */}
          <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-primary/15 via-secondary/5 to-primary/15 opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity duration-500" />
          
          <div className="relative flex items-end gap-2 bg-[#1e1f20]/45 backdrop-blur-xl rounded-[30px] border border-border/15 p-2 px-3.5 shadow-xl group-focus-within:border-primary/20 group-focus-within:bg-[#1e1f20]/65 transition-all duration-300">
            {/* Far Left: File Upload */}
            <div className="flex items-center pb-1 shrink-0">
              <FileUpload
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onClear={() => onFileSelect(null)}
                disabled={isLoading}
              />
            </div>
            
            {/* Center Area: Textarea */}
            <Textarea 
              value={message} 
              onChange={(e) => onMessageChange(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Enter a prompt here"}
              className={`flex-1 min-h-[44px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 px-2 text-[15px] placeholder:text-muted-foreground/35 leading-relaxed overflow-y-auto custom-scrollbar ${
                isListening ? 'placeholder:text-primary placeholder:animate-pulse' : ''
              }`}
              disabled={isLoading}
              rows={1}
            />
            
            {/* Right: Audio Control & Send Action */}
            <div className="flex items-center gap-1.5 pb-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onToggleVoice} 
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-full transition-all duration-300 ${
                        isListening 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                          : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40'
                      }`}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Use microphone</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onOpenImageGenerator}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 hidden sm:flex"
                      disabled={isLoading}
                    >
                      <ImageIcon className="h-4.5 w-4.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Generate image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {isLoading ? (
                <Button 
                  onClick={onStopGeneration} 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-destructive/90 hover:bg-destructive text-destructive-foreground shadow-md shadow-destructive/15 scale-95"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button 
                  onClick={onSend} 
                  size="icon"
                  className="h-9 w-9 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/15 transition-all duration-200 disabled:opacity-15 disabled:bg-muted/30 disabled:text-muted-foreground/40 disabled:shadow-none hover:scale-105 active:scale-95"
                  disabled={!message.trim() && !selectedFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer Footer (Gemini-style) */}
        <p className="text-[11px] text-muted-foreground/35 font-normal tracking-wide text-center mt-3 select-none leading-relaxed">
          ShadowTalk may display inaccurate info, including about people, so double-check its responses. Your privacy & ShadowTalk Apps
        </p>
      </div>
    </div>
  );
};
