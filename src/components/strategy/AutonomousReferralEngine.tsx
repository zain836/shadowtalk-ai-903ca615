import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, Users, Star, Gift, TrendingUp, Award,
  Share2, Crown, ChevronRight, Sparkles, Target,
  Copy, Check, DollarSign, Rocket
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";

interface PowerUser {
  id: string;
  name: string;
  sessions: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  referrals: number;
  potentialReach: number;
  bonusCredits: number;
  status: "identified" | "offered" | "active" | "champion";
}

interface ReferralOffer {
  id: string;
  name: string;
  description: string;
  bonusCredits: number;
  requirements: string;
  expiresIn: string;
  tier: string;
}

const tierConfig = {
  bronze: { color: "text-amber-600", bg: "bg-amber-600/10", border: "border-amber-600/20", label: "Bronze" },
  silver: { color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", label: "Silver" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", label: "Gold" },
  platinum: { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", label: "Platinum" },
};

const mockPowerUsers: PowerUser[] = [
  { id: "1", name: "Alex K.", sessions: 87, tier: "platinum", referrals: 12, potentialReach: 2400, bonusCredits: 500, status: "champion" },
  { id: "2", name: "Sara M.", sessions: 72, tier: "gold", referrals: 8, potentialReach: 1800, bonusCredits: 350, status: "active" },
  { id: "3", name: "James L.", sessions: 65, tier: "gold", referrals: 5, potentialReach: 1200, bonusCredits: 300, status: "offered" },
  { id: "4", name: "Priya R.", sessions: 58, tier: "silver", referrals: 3, potentialReach: 950, bonusCredits: 200, status: "identified" },
  { id: "5", name: "Omar H.", sessions: 54, tier: "silver", referrals: 2, potentialReach: 780, bonusCredits: 200, status: "identified" },
  { id: "6", name: "Liu W.", sessions: 51, tier: "bronze", referrals: 1, potentialReach: 520, bonusCredits: 150, status: "identified" },
];

const referralOffers: ReferralOffer[] = [
  {
    id: "r1",
    name: "Champion's Code",
    description: "Exclusive personalized referral link with 30% bonus credits for both you and your referral",
    bonusCredits: 500,
    requirements: "50+ sessions completed",
    expiresIn: "7 days",
    tier: "platinum",
  },
  {
    id: "r2",
    name: "Power Referral",
    description: "Share on social media and earn 200 credits per signup + 20% of their first purchase",
    bonusCredits: 350,
    requirements: "30+ sessions completed",
    expiresIn: "14 days",
    tier: "gold",
  },
  {
    id: "r3",
    name: "Community Builder",
    description: "Invite 5 friends and unlock the CEO Suite for free for 30 days",
    bonusCredits: 200,
    requirements: "20+ sessions completed",
    expiresIn: "30 days",
    tier: "silver",
  },
];

const statusColors: Record<string, string> = {
  identified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  offered: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  champion: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const AutonomousReferralEngine = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [activatedOffers, setActivatedOffers] = useState<Set<string>>(new Set());

  const totalPotentialReach = mockPowerUsers.reduce((sum, u) => sum + u.potentialReach, 0);
  const activeReferrers = mockPowerUsers.filter(u => u.status === "active" || u.status === "champion").length;
  const totalReferrals = mockPowerUsers.reduce((sum, u) => sum + u.referrals, 0);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`);
    setCopied(code);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const activateOffer = (offerId: string) => {
    setActivatedOffers(prev => new Set([...prev, offerId]));
    toast({
      title: "Offer Activated! 🚀",
      description: "Personalized referral codes have been generated and sent.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Engine Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 neon-glow">
                <Rocket className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Autonomous Referral Engine</h2>
                <p className="text-muted-foreground text-sm">
                  AI-driven power user detection with personalized referral campaigns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{mockPowerUsers.length}</p>
                <p className="text-xs text-muted-foreground">Power Users</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{activeReferrers}</p>
                <p className="text-xs text-muted-foreground">Active Referrers</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">{totalPotentialReach.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Potential Reach</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Power Users List */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-yellow-400" />
              Detected Power Users
            </CardTitle>
            <CardDescription>
              Users with 50+ sessions automatically identified for referral activation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPowerUsers.map((powerUser, i) => {
                const tier = tierConfig[powerUser.tier];
                return (
                  <motion.div
                    key={powerUser.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full ${tier.bg} flex items-center justify-center`}>
                        <Star className={`h-5 w-5 ${tier.color}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{powerUser.name}</p>
                          <Badge variant="outline" className={`text-[10px] ${tier.color} ${tier.border}`}>
                            {tier.label}
                          </Badge>
                          <Badge className={`text-[10px] ${statusColors[powerUser.status]}`}>
                            {powerUser.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {powerUser.sessions} sessions • {powerUser.referrals} referrals • {powerUser.potentialReach} reach
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        +{powerUser.bonusCredits}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(`PU-${powerUser.id}`)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copied === `PU-${powerUser.id}` ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Referral Offers */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-accent" />
              AI-Generated Offers
            </CardTitle>
            <CardDescription>
              Personalized campaigns based on user behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {referralOffers.map((offer) => {
                const isActivated = activatedOffers.has(offer.id);
                return (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isActivated ? "border-green-500/30 bg-green-500/5" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm">{offer.name}</h4>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {offer.expiresIn}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{offer.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{offer.requirements}</span>
                      <Button
                        size="sm"
                        variant={isActivated ? "outline" : "default"}
                        disabled={isActivated}
                        onClick={() => activateOffer(offer.id)}
                        className="text-xs gap-1"
                      >
                        {isActivated ? (
                          <>
                            <Check className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <Zap className="h-3 w-3" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Referral Growth Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "Identified Power Users", count: mockPowerUsers.length, total: mockPowerUsers.length, color: "bg-blue-500" },
              { label: "Offers Sent", count: mockPowerUsers.filter(u => u.status !== "identified").length, total: mockPowerUsers.length, color: "bg-yellow-500" },
              { label: "Active Referrers", count: activeReferrers, total: mockPowerUsers.length, color: "bg-green-500" },
              { label: "Champions", count: mockPowerUsers.filter(u => u.status === "champion").length, total: mockPowerUsers.length, color: "bg-purple-500" },
            ].map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="text-muted-foreground">{stage.count}/{stage.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(stage.count / stage.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full rounded-full ${stage.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">
                {Math.round((activeReferrers / mockPowerUsers.length) * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Activation Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">
                ${mockPowerUsers.reduce((sum, u) => sum + u.bonusCredits, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Credits Allocated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutonomousReferralEngine;
