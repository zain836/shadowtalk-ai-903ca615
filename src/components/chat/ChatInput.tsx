import { Send, Mic, MicOff, Square, Image as ImageIcon, Sparkles, Search, Camera, Table, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/chat/FileUpload";
import { ModeSelector, ChatMode } from "@/components/chat/ModeSelector";
import { SearchHistory } from "@/components/chat/SearchHistory";
import { motion, AnimatePresence } from "framer-motion";
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
  isSpeaking?: boolean;
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
  isSpeaking = false,
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
    <div className="relative border-t border-transparent bg-transparent">
      {/* Neural Expressive Audio Pill */}
      <AnimatePresence>
        {(isListening || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className="fixed bottom-36 left-1/2 z-50"
          >
            <div className="bg-[#1e1f20]/95 backdrop-blur-2xl border border-white/10 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl shadow-black/50 ring-1 ring-white/5">
              <div className="flex gap-1.5 items-center h-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isListening ? [8, 16, 8] : [4, 10, 4],
                      backgroundColor: isListening ? ["#60a5fa", "#a78bfa", "#60a5fa"] : ["#94a3b8", "#e2e8f0", "#94a3b8"]
                    }}
                    transition={{ 
                      duration: isListening ? 0.6 : 1.2, 
                      repeat: Infinity, 
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                    className="w-1 bg-blue-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-[13px] font-medium text-foreground tracking-tight">
                {isListening ? "Listening..." : "ShadowTalk is speaking"}
              </span>
              {isSpeaking && <Volume2 className="h-3.5 w-3.5 text-blue-400 animate-pulse" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6 relative">
        {/* Mode Chips & Info */}
        <div className="flex items-center gap-2 mb-3 px-1">
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
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 shrink-0 font-medium ml-auto tracking-wider uppercase">
            <Sparkles className="h-3 w-3 text-primary/30" />
            <span>{chatMode}</span>
            <span className="opacity-20">|</span>
            <span>{personality}</span>
          </div>
        </div>

        {/* Input Bar — Fluid Neural Pill */}
        <div className="relative group">
          {/* Subtle Dynamic Glow */}
          <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-700" />
          
          <div className="relative flex items-end gap-2 bg-[#1e1f20]/60 backdrop-blur-2xl rounded-[30px] border border-white/10 p-2.5 px-4 shadow-2xl transition-all duration-500 group-focus-within:bg-[#1e1f20]/80 group-focus-within:border-white/20 ring-1 ring-white/5">
            {/* File Upload */}
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
              placeholder={isListening ? "Listening..." : "Type, talk, or share..."}
              className="flex-1 min-h-[46px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 px-2 text-[15.5px] placeholder:text-muted-foreground/30 leading-relaxed overflow-y-auto custom-scrollbar"
              disabled={isLoading}
              rows={1}
            />
            
            {/* Actions */}
            <div className="flex items-center gap-1 pb-1 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onToggleVoice} 
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-full transition-all duration-500 ${
                        isListening 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-110' 
                          : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/5'
                      }`}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs bg-black/90 border-white/10">Voice input</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {isLoading ? (
                <Button 
                  onClick={onStopGeneration} 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-destructive/80 hover:bg-destructive text-white shadow-lg shadow-destructive/20"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button 
                  onClick={onSend} 
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90 shadow-lg transition-all duration-300 disabled:opacity-10 disabled:bg-white/5 disabled:text-white/20 hover:scale-105 active:scale-95"
                  disabled={!message.trim() && !selectedFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground/25 font-medium text-center mt-4 select-none tracking-widest uppercase">
          ShadowTalk Neural OS • Enterprise Grade Privacy
        </p>
      </div>
    </div>
  );
};
