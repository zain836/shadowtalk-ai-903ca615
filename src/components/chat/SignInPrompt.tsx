import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogIn, Sparkles, Zap, Shield, Crown } from "lucide-react";

interface SignInPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'chats' | 'images' | 'deepResearch' | 'general';
  usedCount?: number;
  limitCount?: number;
}

export function SignInPrompt({ open, onOpenChange, reason, usedCount, limitCount }: SignInPromptProps) {
  const navigate = useNavigate();

  const reasonMessages = {
    chats: {
      title: "You've used your free chats!",
      description: `You've enjoyed ${usedCount || 10} free AI conversations. Sign in to continue chatting!`,
      icon: Zap,
      benefits: [
        "50 messages per day (Free tier)",
        "Unlimited with Pro subscription",
        "Save conversation history",
        "Access advanced features",
      ]
    },
    images: {
      title: "Image generation limit reached!",
      description: `You've created ${usedCount || 5} free images. Sign in to generate more!`,
      icon: Sparkles,
      benefits: [
        "4 images per day (Free tier)",
        "20+ images with Pro subscription",
        "HD quality outputs",
        "Save to your gallery",
      ]
    },
    deepResearch: {
      title: "Deep Research limit reached!",
      description: `You've used ${usedCount || 5} free research queries. Sign in for more!`,
      icon: Shield,
      benefits: [
        "5 research queries per day (Free)",
        "More with Pro subscription",
        "Multi-source analysis",
        "Export research reports",
      ]
    },
    general: {
      title: "Sign in to continue",
      description: "Create a free account to unlock more features!",
      icon: Crown,
      benefits: [
        "Save your conversations",
        "Access all AI features",
        "Sync across devices",
        "Priority support",
      ]
    }
  };

  const config = reasonMessages[reason];
  const Icon = config.icon;

  const handleSignIn = () => {
    navigate('/auth');
    onOpenChange(false);
  };

  const handleContinueGuest = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits list */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-foreground mb-3">
              ✨ Sign in to unlock:
            </p>
            {config.benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {benefit}
              </div>
            ))}
          </div>

          {/* Comparison with ChatGPT */}
          <div className="bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 rounded-lg p-3">
            <p className="text-xs font-medium text-success flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Better than ChatGPT Free!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ChatGPT limits free users to ~3 images & ~3 research queries. 
              <span className="text-foreground font-medium"> ShadowTalk gives you 4 images & 5 research queries!</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleSignIn} className="w-full gap-2">
            <LogIn className="w-4 h-4" />
            Sign In / Create Account
          </Button>
          <Button variant="ghost" onClick={handleContinueGuest} className="w-full text-muted-foreground">
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
