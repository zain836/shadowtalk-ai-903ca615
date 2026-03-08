import { useState } from 'react';
import { useScreenAgent, ScreenAction } from '@/hooks/useScreenAgent';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { 
  Monitor, MonitorOff, Camera, Copy, Code, Search, 
  Loader2, X, Maximize2, Minimize2, Eye 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScreenAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (message: string, screenshot?: string) => void;
}

export const ScreenAgent = ({ isOpen, onClose, onSendToChat }: ScreenAgentProps) => {
  const { toast } = useToast();
  const { state, videoRef, canvasRef, startScreenShare, stopScreenShare, captureScreenshot, analyzeScreen } = useScreenAgent();
  const [userPrompt, setUserPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleCapture = async (action: ScreenAction) => {
    const screenshot = await captureScreenshot();
    if (!screenshot) return;
    await analyzeScreen(screenshot, action, userPrompt || undefined);
  };

  const handleCopyCode = () => {
    const codeMatch = state.streamedResponse.match(/```(?:tsx|jsx|html|css)?\n([\s\S]*?)```/);
    if (codeMatch) {
      navigator.clipboard.writeText(codeMatch[1]);
      toast({ title: '✅ Code copied!' });
    } else {
      navigator.clipboard.writeText(state.streamedResponse);
      toast({ title: '📋 Response copied!' });
    }
  };

  const handleSendToChat = () => {
    if (state.streamedResponse && onSendToChat) {
      onSendToChat(state.streamedResponse, state.lastScreenshot || undefined);
    }
  };

  const panelWidth = isExpanded ? 'w-[700px]' : 'w-[480px]';

  return (
    <div className={`fixed right-4 bottom-20 ${panelWidth} max-h-[85vh] z-50 flex flex-col rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${state.isSharing ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
          <span className="text-sm font-bold tracking-wide">Screen Agent</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">KIMI-STYLE</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Screen share controls */}
      <div className="px-4 py-3 border-b border-border/20 space-y-3">
        <div className="flex gap-2">
          {!state.isSharing ? (
            <Button onClick={startScreenShare} size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
              <Monitor className="h-4 w-4 mr-2" />
              Share Screen
            </Button>
          ) : (
            <Button onClick={stopScreenShare} size="sm" variant="destructive" className="flex-1">
              <MonitorOff className="h-4 w-4 mr-2" />
              Stop Sharing
            </Button>
          )}
        </div>

        {/* Preview of screen share */}
        {state.isSharing && (
          <div className="relative rounded-lg overflow-hidden border border-border/30 bg-black/50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-32 object-contain"
            />
            <div className="absolute top-1 right-1 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-mono">LIVE</span>
            </div>
          </div>
        )}

        {/* User prompt input */}
        <Textarea
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
          placeholder="Optional: tell the AI what to do... (e.g. 'Clone this landing page' or 'What framework is this?')"
          className="min-h-[60px] text-xs resize-none bg-muted/30 border-border/30"
        />

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleCapture('clone')}
            disabled={state.isAnalyzing || state.isCapturing}
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {state.isAnalyzing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Code className="h-3.5 w-3.5 mr-1.5" />}
            Clone UI
          </Button>
          <Button
            onClick={() => handleCapture('analyze')}
            disabled={state.isAnalyzing || state.isCapturing}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {state.isAnalyzing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
            Analyze
          </Button>
          <Button
            onClick={() => handleCapture('auto')}
            disabled={state.isAnalyzing || state.isCapturing}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Auto
          </Button>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Screenshot preview */}
      {state.lastScreenshot && (
        <div className="px-4 pt-2">
          <div className="relative rounded-lg overflow-hidden border border-border/30">
            <img src={state.lastScreenshot} alt="Captured screen" className="w-full h-24 object-cover" />
            <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
              <span className="text-[10px] text-white font-mono flex items-center gap-1">
                <Camera className="h-3 w-3" /> Captured
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI Response */}
      {(state.streamedResponse || state.isAnalyzing) && (
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-3">
            {state.isAnalyzing && !state.streamedResponse && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing your screen...
              </div>
            )}
            {state.streamedResponse && (
              <div className="prose prose-sm prose-invert max-w-none text-sm">
                <ReactMarkdown>{state.streamedResponse}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Bottom actions */}
      {state.streamedResponse && !state.isAnalyzing && (
        <div className="px-4 py-2 border-t border-border/20 flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCopyCode} className="flex-1 text-xs">
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
          {onSendToChat && (
            <Button size="sm" variant="outline" onClick={handleSendToChat} className="flex-1 text-xs">
              Send to Chat
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default ScreenAgent;
