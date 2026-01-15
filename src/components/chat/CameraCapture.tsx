import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraOff, FlipHorizontal, X, Send, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string, question: string) => void;
}

export const CameraCapture = ({ isOpen, onClose, onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: 'Camera Access Denied',
        description: 'Please allow camera access to use this feature.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setQuestion('');
    }
  }, [isOpen, stopCamera]);

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const flipCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleSubmit = () => {
    if (capturedImage) {
      onCapture(capturedImage, question || 'What can you tell me about this?');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Camera Analysis
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {capturedImage ? (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {capturedImage ? (
              <>
                <Button variant="outline" onClick={retake} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retake
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={flipCamera} disabled={isLoading}>
                  <FlipHorizontal className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  className="rounded-full w-16 h-16" 
                  onClick={captureImage}
                  disabled={isLoading || !stream}
                >
                  <Camera className="h-6 w-6" />
                </Button>
                <Button variant="outline" size="icon" onClick={onClose}>
                  <CameraOff className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Question Input */}
          {capturedImage && (
            <div className="space-y-3">
              <Textarea
                placeholder="Ask a question about this image... (e.g., 'What plant is this?', 'How do I fix this?')"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setQuestion('What is this?')}>
                  <Sparkles className="h-4 w-4" />
                  Identify
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setQuestion('How do I fix this?')}>
                  <Sparkles className="h-4 w-4" />
                  Help Fix
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setQuestion('Explain what you see in detail.')}>
                  <Sparkles className="h-4 w-4" />
                  Explain
                </Button>
              </div>
              <Button onClick={handleSubmit} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Ask AI
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Point your camera at anything and ask questions about it
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraCapture;
