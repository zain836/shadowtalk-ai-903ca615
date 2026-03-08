import { useState, useEffect } from "react";
import { Settings2, Sliders, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { Separator } from "@/components/ui/separator";
import { useUserSettings } from "@/hooks/useUserSettings";

interface CustomInstructions {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streamResponses: boolean;
  includeCitations: boolean;
}

interface CustomInstructionsProps {
  onInstructionsChange: (instructions: CustomInstructions) => void;
}

const defaultInstructions: CustomInstructions = {
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  streamResponses: true,
  includeCitations: true,
};

export const CustomInstructions = ({ onInstructionsChange }: CustomInstructionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { value: savedInstructions, save: saveToBackend, isLoading } = useUserSettings<CustomInstructions>('custom_instructions', defaultInstructions);
  const [instructions, setInstructions] = useState<CustomInstructions>(defaultInstructions);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from backend
  useEffect(() => {
    if (!isLoading && savedInstructions) {
      setInstructions(savedInstructions);
      onInstructionsChange(savedInstructions);
    }
  }, [isLoading, savedInstructions]);

  const handleChange = <K extends keyof CustomInstructions>(key: K, value: CustomInstructions[K]) => {
    const updated = { ...instructions, [key]: value };
    setInstructions(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveToBackend(instructions);
    onInstructionsChange(instructions);
    setHasChanges(false);
    toast({ title: "Settings saved", description: "Your custom instructions have been saved." });
  };

  const handleReset = () => {
    setInstructions(defaultInstructions);
    setHasChanges(true);
    toast({ title: "Settings reset to defaults" });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-xs">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Custom Instructions
          </SheetTitle>
          <SheetDescription>
            Customize how the AI responds to you. These settings apply to all conversations.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* System Prompt */}
          <div className="space-y-2">
            <Label>Custom System Instructions</Label>
            <Textarea
              placeholder="Add custom instructions for the AI... (e.g., 'Always respond in bullet points' or 'Act as a senior software engineer')"
              value={instructions.systemPrompt}
              onChange={(e) => handleChange('systemPrompt', e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be added to every conversation.
            </p>
          </div>

          <Separator />

          {/* Model Parameters */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Model Parameters
            </h3>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm text-muted-foreground">{instructions.temperature}</span>
              </div>
              <Slider
                value={[instructions.temperature]}
                onValueChange={([v]) => handleChange('temperature', v)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Higher = more creative, Lower = more focused
              </p>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Response Length</Label>
                <span className="text-sm text-muted-foreground">{instructions.maxTokens}</span>
              </div>
              <Slider
                value={[instructions.maxTokens]}
                onValueChange={([v]) => handleChange('maxTokens', v)}
                min={256}
                max={32768}
                step={256}
              />
            </div>

            {/* Top P */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Top P (Nucleus Sampling)</Label>
                <span className="text-sm text-muted-foreground">{instructions.topP}</span>
              </div>
              <Slider
                value={[instructions.topP]}
                onValueChange={([v]) => handleChange('topP', v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>

            {/* Frequency Penalty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Frequency Penalty</Label>
                <span className="text-sm text-muted-foreground">{instructions.frequencyPenalty}</span>
              </div>
              <Slider
                value={[instructions.frequencyPenalty]}
                onValueChange={([v]) => handleChange('frequencyPenalty', v)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Reduces repetition of words
              </p>
            </div>

            {/* Presence Penalty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Presence Penalty</Label>
                <span className="text-sm text-muted-foreground">{instructions.presencePenalty}</span>
              </div>
              <Slider
                value={[instructions.presencePenalty]}
                onValueChange={([v]) => handleChange('presencePenalty', v)}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Encourages talking about new topics
              </p>
            </div>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="space-y-4">
            <h3 className="font-medium">Response Options</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>Stream Responses</Label>
                <p className="text-xs text-muted-foreground">Show responses as they're generated</p>
              </div>
              <Switch
                checked={instructions.streamResponses}
                onCheckedChange={(v) => handleChange('streamResponses', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Citations</Label>
                <p className="text-xs text-muted-foreground">Add source citations to research responses</p>
              </div>
              <Switch
                checked={instructions.includeCitations}
                onCheckedChange={(v) => handleChange('includeCitations', v)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
