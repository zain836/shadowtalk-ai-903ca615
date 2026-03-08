import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music, X, Play, Pause, Download, Loader2,
  Volume2, Clock, Sparkles, RotateCw, Square,
  Music2, Disc3, Wand2, Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface MusicGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  autoGenerate?: boolean;
  onInsertToChat?: (content: string) => void;
}

interface GeneratedTrack {
  id: string;
  prompt: string;
  type: "music" | "sfx";
  audioUrl: string;
  duration: number;
  createdAt: Date;
}

const MUSIC_PRESETS = [
  { label: "Lo-fi Chill", prompt: "Relaxing lo-fi hip hop beat with soft piano and vinyl crackle" },
  { label: "Epic Cinematic", prompt: "Epic cinematic orchestral score with rising strings and drums" },
  { label: "Ambient Focus", prompt: "Calm ambient electronic music for deep focus and concentration" },
  { label: "Upbeat Pop", prompt: "Catchy upbeat pop instrumental with synths and claps" },
  { label: "Dark Synthwave", prompt: "Dark retro synthwave with pulsing bass and atmospheric pads" },
  { label: "Jazz Café", prompt: "Smooth jazz café music with saxophone and soft drums" },
];

const SFX_PRESETS = [
  { label: "Notification", prompt: "Short pleasant notification chime sound" },
  { label: "Explosion", prompt: "Dramatic cinematic explosion with debris" },
  { label: "Rain", prompt: "Gentle rain falling on a window with soft thunder" },
  { label: "Typing", prompt: "Mechanical keyboard typing sounds rapid" },
  { label: "Whoosh", prompt: "Fast swoosh transition sound effect" },
  { label: "Success", prompt: "Achievement unlocked celebration jingle" },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function MusicGenerator({ isOpen, onClose, initialPrompt, autoGenerate, onInsertToChat }: MusicGeneratorProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<"music" | "sfx">("music");
  const [isGenerating, setIsGenerating] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateAudio = useCallback(async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the music or sound you want", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          duration: type === "music" ? duration : Math.min(duration, 22),
          type,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || `Failed: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      const track: GeneratedTrack = {
        id: crypto.randomUUID(),
        prompt: finalPrompt,
        type,
        audioUrl,
        duration: type === "music" ? duration : Math.min(duration, 22),
        createdAt: new Date(),
      };

      setTracks(prev => [track, ...prev]);
      toast({ title: `${type === "music" ? "🎵 Music" : "🔊 SFX"} Generated!`, description: finalPrompt.slice(0, 60) });

      // Auto-play
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingId(track.id);
      audio.onended = () => setPlayingId(null);
      audio.play().catch(() => {});
      
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, duration, type, toast]);

  const togglePlay = (track: GeneratedTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      setPlayingId(track.id);
      audio.onended = () => setPlayingId(null);
      audio.play().catch(() => {});
    }
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    a.download = `shadowtalk-${track.type}-${Date.now()}.mp3`;
    a.click();
  };

  if (!isOpen) return null;

  const presets = type === "music" ? MUSIC_PRESETS : SFX_PRESETS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">AI Music Studio</h2>
                <p className="text-xs text-muted-foreground">Generate music & sound effects with AI</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="max-h-[calc(85vh-80px)]">
            <div className="p-6 space-y-5">
              {/* Type Tabs */}
              <Tabs value={type} onValueChange={(v) => setType(v as "music" | "sfx")}>
                <TabsList className="w-full">
                  <TabsTrigger value="music" className="flex-1 gap-2">
                    <Music2 className="w-4 h-4" /> Music
                  </TabsTrigger>
                  <TabsTrigger value="sfx" className="flex-1 gap-2">
                    <Waves className="w-4 h-4" /> Sound Effects
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Describe your {type === "music" ? "track" : "sound"}</label>
                <div className="flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={type === "music" 
                      ? "E.g., Upbeat electronic dance track with deep bass..."
                      : "E.g., Futuristic laser beam sound..."
                    }
                    onKeyDown={(e) => e.key === "Enter" && !isGenerating && generateAudio()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => generateAudio()} 
                    disabled={isGenerating || !prompt.trim()}
                    className="gap-2 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Duration
                  </label>
                  <Badge variant="outline" className="text-xs">{duration}s</Badge>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([v]) => setDuration(v)}
                  min={type === "music" ? 5 : 1}
                  max={type === "music" ? 120 : 22}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{type === "music" ? "5s" : "1s"}</span>
                  <span>{type === "music" ? "120s" : "22s"}</span>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setPrompt(preset.prompt);
                        generateAudio(preset.prompt);
                      }}
                      disabled={isGenerating}
                      className="text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs disabled:opacity-50"
                    >
                      <span className="font-medium text-foreground">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generating Animation */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col items-center gap-3 py-6 rounded-xl bg-primary/5 border border-primary/10"
                >
                  <div className="flex items-center gap-1">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 24 + Math.random() * 16, 8] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                        className="w-1.5 rounded-full bg-primary/60"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Creating your {type === "music" ? "track" : "sound effect"}...
                  </p>
                </motion.div>
              )}

              {/* Generated Tracks */}
              {tracks.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 text-muted-foreground" />
                    Generated ({tracks.length})
                  </label>
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          playingId === track.id 
                            ? "border-primary/40 bg-primary/5" 
                            : "border-border/50 hover:border-border"
                        }`}
                      >
                        {/* Play Button */}
                        <Button
                          size="icon"
                          variant={playingId === track.id ? "default" : "outline"}
                          className="h-9 w-9 shrink-0 rounded-full"
                          onClick={() => togglePlay(track)}
                        >
                          {playingId === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </Button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{track.prompt}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {track.type === "music" ? "🎵 Music" : "🔊 SFX"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{track.duration}s</span>
                          </div>
                        </div>

                        {/* Waveform animation when playing */}
                        {playingId === track.id && (
                          <div className="flex items-center gap-0.5 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                animate={{ height: [4, 14 + Math.random() * 8, 4] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 rounded-full bg-primary"
                              />
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => downloadTrack(track)}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setPrompt(track.prompt);
                              generateAudio(track.prompt);
                            }}
                            disabled={isGenerating}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
