 import { Switch } from '@/components/ui/switch';
 import { Label } from '@/components/ui/label';
 import { Slider } from '@/components/ui/slider';
 import { Button } from '@/components/ui/button';
 import { AlertTriangle, Shield, Eye, Volume2 } from 'lucide-react';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 
 interface PrivacyControlsProps {
   analysisInterval: number;
   onIntervalChange: (interval: number) => void;
   autoSpeak: boolean;
   onAutoSpeakChange: (enabled: boolean) => void;
   onStop: () => void;
 }
 
 export const PrivacyControls = ({
   analysisInterval,
   onIntervalChange,
   autoSpeak,
   onAutoSpeakChange,
   onStop
 }: PrivacyControlsProps) => {
   return (
     <div className="space-y-6 py-4">
       {/* Privacy Notice */}
       <Alert>
         <Shield className="h-4 w-4" />
         <AlertTitle>Privacy First</AlertTitle>
         <AlertDescription className="text-sm">
           Your camera feed is analyzed in real-time and never stored. 
           All processing happens securely.
         </AlertDescription>
       </Alert>
       
       {/* Analysis Frequency */}
       <div className="space-y-3">
         <div className="flex items-center justify-between">
           <Label className="flex items-center gap-2">
             <Eye className="h-4 w-4" />
             Analysis Frequency
           </Label>
           <span className="text-sm text-muted-foreground">
             Every {analysisInterval / 1000}s
           </span>
         </div>
         <Slider
           value={[analysisInterval]}
           onValueChange={(v) => onIntervalChange(v[0])}
           min={1000}
           max={10000}
           step={1000}
           className="w-full"
         />
         <p className="text-xs text-muted-foreground">
           Lower = more responsive but uses more resources
         </p>
       </div>
       
       {/* Auto-Speak */}
       <div className="flex items-center justify-between">
         <Label htmlFor="auto-speak" className="flex items-center gap-2">
           <Volume2 className="h-4 w-4" />
           Proactive Speaking
         </Label>
         <Switch
           id="auto-speak"
           checked={autoSpeak}
           onCheckedChange={onAutoSpeakChange}
         />
       </div>
       <p className="text-xs text-muted-foreground -mt-4">
         Let the AI speak first based on what it observes
       </p>
       
       {/* Gesture Commands */}
       <div className="space-y-2">
         <Label>Gesture Commands</Label>
         <div className="grid grid-cols-2 gap-2 text-sm">
           <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
             <span>👋</span>
             <span className="text-muted-foreground">Wave = Greet</span>
           </div>
           <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
             <span>👍</span>
             <span className="text-muted-foreground">Thumbs = Confirm</span>
           </div>
           <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
             <span>✋</span>
             <span className="text-muted-foreground">Palm = Stop</span>
           </div>
           <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
             <span>🤔</span>
             <span className="text-muted-foreground">Think = Wait</span>
           </div>
         </div>
       </div>
       
       {/* Stop Button */}
       <Button 
         variant="destructive" 
         className="w-full"
         onClick={onStop}
       >
         <AlertTriangle className="h-4 w-4 mr-2" />
         Stop Vision Agent
       </Button>
       
       {/* What Can It See */}
       <div className="pt-4 border-t">
         <h4 className="font-medium mb-2 text-sm">What Vision Agent Detects:</h4>
         <ul className="text-xs text-muted-foreground space-y-1">
           <li>• Facial expressions & emotions</li>
           <li>• Eye contact & engagement level</li>
           <li>• Body posture</li>
           <li>• Hand gestures</li>
           <li>• Room lighting conditions</li>
         </ul>
       </div>
     </div>
   );
 };
 
 export default PrivacyControls;