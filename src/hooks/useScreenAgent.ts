import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type ScreenAction = 'clone' | 'analyze' | 'auto';

interface ScreenAgentState {
  isSharing: boolean;
  isCapturing: boolean;
  isAnalyzing: boolean;
  lastScreenshot: string | null;
  streamedResponse: string;
  error: string | null;
}

export function useScreenAgent() {
  const { toast } = useToast();
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<ScreenAgentState>({
    isSharing: false,
    isCapturing: false,
    isAnalyzing: false,
    lastScreenshot: null,
    streamedResponse: '',
    error: null,
  });

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as any,
        audio: false,
      });
      streamRef.current = stream;
      setState(s => ({ ...s, isSharing: true, error: null }));

      // Auto-stop when user clicks "Stop sharing"
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Attach to hidden video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      toast({ title: '🖥️ Screen sharing active', description: 'Your screen is now visible to ShadowTalk' });
      return true;
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        toast({ title: 'Screen share failed', description: err.message, variant: 'destructive' });
      }
      return false;
    }
  }, [toast]);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(s => ({ ...s, isSharing: false }));
  }, []);

  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    setState(s => ({ ...s, isCapturing: true }));
    try {
      let dataUrl: string;

      if (state.isSharing && videoRef.current && videoRef.current.readyState >= 2) {
        // Capture from active screen share
        const canvas = canvasRef.current || document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.min(video.videoHeight, 720);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      } else {
        // One-shot screenshot via getDisplayMedia
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' } as any,
          audio: false,
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        
        // Wait a frame for rendering
        await new Promise(r => setTimeout(r, 200));
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.min(video.videoHeight, 720);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Immediately stop the stream
        stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }

      setState(s => ({ ...s, isCapturing: false, lastScreenshot: dataUrl }));
      return dataUrl;
    } catch (err: any) {
      setState(s => ({ ...s, isCapturing: false }));
      if (err.name !== 'NotAllowedError') {
        toast({ title: 'Screenshot failed', description: err.message, variant: 'destructive' });
      }
      return null;
    }
  }, [state.isSharing, toast]);

  const analyzeScreen = useCallback(async (
    screenshot: string,
    action: ScreenAction = 'auto',
    userPrompt?: string
  ): Promise<string> => {
    setState(s => ({ ...s, isAnalyzing: true, streamedResponse: '', error: null }));

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/screen-analyze`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ screenshot, action, userPrompt }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData.error || `Status ${resp.status}`);
      }

      // Stream SSE
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setState(s => ({ ...s, streamedResponse: fullText }));
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setState(s => ({ ...s, isAnalyzing: false }));
      return fullText;
    } catch (err: any) {
      setState(s => ({ ...s, isAnalyzing: false, error: err.message }));
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
      return '';
    }
  }, [toast]);

  return {
    state,
    videoRef,
    canvasRef,
    startScreenShare,
    stopScreenShare,
    captureScreenshot,
    analyzeScreen,
  };
}
