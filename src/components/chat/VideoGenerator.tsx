import { useState } from 'react';
import { Video, Sparkles, Loader2, Download, X, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface VideoGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoGenerated?: (videoUrl: string, prompt: string) => void;
  dailyLimit?: number;
  usedToday?: number;
}

export const VideoGenerator = ({ 
  isOpen, 
  onClose, 
  onVideoGenerated,
  dailyLimit = 2,
  usedToday = 0
}: VideoGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const remainingUses = dailyLimit - usedToday;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' });
      return;
    }

    if (remainingUses <= 0) {
      toast({ 
        title: 'Daily limit reached', 
        description: 'You can generate up to 2 videos per day.',
        variant: 'destructive' 
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Simulate video generation progress (in production, this would be real API calls)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Simulated video generation - in production this would call Veo API
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // In production, this would be the actual generated video URL
      const mockVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      setGeneratedVideo(mockVideoUrl);
      
      toast({ title: 'Video generated successfully!' });
      onVideoGenerated?.(mockVideoUrl, prompt);
    } catch (error) {
      clearInterval(progressInterval);
      toast({ 
        title: 'Video generation failed', 
        description: 'Please try again later.',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo) {
      const a = document.createElement('a');
      a.href = generatedVideo;
      a.download = `shadowtalk-video-${Date.now()}.mp4`;
      a.click();
    }
  };

  const resetForm = () => {
    setPrompt('');
    setGeneratedVideo(null);
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              AI Video Generator
            </CardTitle>
            <CardDescription>Create short videos with AI (Veo model)</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={remainingUses > 0 ? 'secondary' : 'destructive'}>
              {remainingUses}/{dailyLimit} remaining today
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedVideo ? (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={generatedVideo}
                  controls
                  className="w-full h-full"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1 gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Another
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Prompt: "{prompt}"
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prompt */}
              <div className="space-y-2">
                <Label>Describe your video</Label>
                <Textarea
                  placeholder="A serene beach at sunset with gentle waves, a flock of birds flying in the distance..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={(v) => setDuration(v as '5' | '10')} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '16:9' | '9:16' | '1:1')} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                      <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <Label>Quick prompts</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'A peaceful forest with sunlight filtering through trees',
                    'Abstract colorful shapes morphing and flowing',
                    'A futuristic city with flying cars at night',
                    'Ocean waves crashing on rocky cliffs'
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(suggestion)}
                      disabled={isGenerating}
                      className="text-xs"
                    >
                      {suggestion.slice(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Generating video...</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    This may take a minute or two
                  </p>
                </div>
              )}

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                className="w-full gap-2"
                disabled={isGenerating || !prompt.trim() || remainingUses <= 0}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Videos are generated using advanced AI. Generation typically takes 1-2 minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGenerator;
