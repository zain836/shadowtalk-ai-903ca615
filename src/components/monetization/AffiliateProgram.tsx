import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  DollarSign, 
  Link2, 
  Copy, 
  Check, 
  TrendingUp,
  Gift,
  Award,
  Target,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AffiliateStats {
  totalReferrals: number;
  activeSubscribers: number;
  totalEarnings: number;
  pendingPayout: number;
  conversionRate: number;
  clicks: number;
}

interface AffiliateTier {
  name: string;
  minReferrals: number;
  commission: number;
  perks: string[];
  color: string;
}

const AFFILIATE_TIERS: AffiliateTier[] = [
  { 
    name: "Starter", 
    minReferrals: 0, 
    commission: 20, 
    perks: ["20% recurring commission", "Basic dashboard"],
    color: "bg-muted"
  },
  { 
    name: "Bronze", 
    minReferrals: 10, 
    commission: 25, 
    perks: ["25% recurring commission", "Priority payouts", "Referral analytics"],
    color: "bg-amber-500/20"
  },
  { 
    name: "Silver", 
    minReferrals: 50, 
    commission: 30, 
    perks: ["30% recurring commission", "Co-marketing support", "Custom affiliate link"],
    color: "bg-gray-400/20"
  },
  { 
    name: "Gold", 
    minReferrals: 200, 
    commission: 35, 
    perks: ["35% recurring commission", "Dedicated manager", "Early access features"],
    color: "bg-yellow-500/20"
  },
  { 
    name: "Diamond", 
    minReferrals: 500, 
    commission: 40, 
    perks: ["40% recurring commission", "Revenue share deals", "White-label options"],
    color: "bg-cyan-400/20"
  },
];

export function AffiliateProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    activeSubscribers: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    conversionRate: 0,
    clicks: 0,
  });

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = async () => {
    if (!user) return;

    // Get or create referral code
    const { data: codeData } = await supabase
      .from('user_referral_codes')
      .select('referral_code')
      .eq('user_id', user.id)
      .single();

    if (codeData) {
      setReferralCode(codeData.referral_code);
    } else {
      const newCode = `ST${user.id.slice(0, 8).toUpperCase()}`;
      await supabase.from('user_referral_codes').insert({ user_id: user.id, referral_code: newCode });
      setReferralCode(newCode);
    }

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id);

    if (referrals) {
      const active = referrals.filter(r => r.status === 'converted');
      const earnings = referrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0);
      
      // Fetch real click count from affiliate_clicks
      const { count: clickCount } = await supabase
        .from('affiliate_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const paidCommissions = referrals.filter(r => r.commission_paid).reduce((s, r) => s + (r.commission_amount || 0), 0);

      setStats({
        totalReferrals: referrals.length,
        activeSubscribers: active.length,
        totalEarnings: earnings,
        pendingPayout: earnings - paidCommissions,
        conversionRate: referrals.length > 0 ? (active.length / referrals.length) * 100 : 0,
        clicks: clickCount || 0,
      });
    }
  };

  const referralLink = `https://shadowtalk-ai.lovable.app?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrentTier = (): AffiliateTier => {
    return [...AFFILIATE_TIERS].reverse().find(t => stats.totalReferrals >= t.minReferrals) || AFFILIATE_TIERS[0];
  };

  const getNextTier = (): AffiliateTier | null => {
    const currentIndex = AFFILIATE_TIERS.findIndex(t => t.name === getCurrentTier().name);
    return AFFILIATE_TIERS[currentIndex + 1] || null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="space-y-6">
      {/* Affiliate Link Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-success/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Your Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="font-mono text-sm bg-muted/50"
            />
            <Button onClick={copyLink} variant="outline" className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Earn <span className="font-semibold text-success">{currentTier.commission}% commission</span> on every subscription from your referrals!
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Users className="h-4 w-4" />
              Total Referrals
            </div>
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="h-4 w-4" />
              Conversion Rate
            </div>
            <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Total Earnings
            </div>
            <p className="text-2xl font-bold text-success">${stats.totalEarnings.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Wallet className="h-4 w-4" />
              Pending Payout
            </div>
            <p className="text-2xl font-bold">${stats.pendingPayout.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Tier & Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Affiliate Tier
            </div>
            <Badge className={currentTier.color}>{currentTier.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Current Benefits</h4>
              <ul className="space-y-1">
                {currentTier.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
            
            {nextTier && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Next: {nextTier.name}</h4>
                  <Badge variant="outline">{nextTier.commission}% commission</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {nextTier.minReferrals - stats.totalReferrals} more referrals needed
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${Math.min((stats.totalReferrals / nextTier.minReferrals) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Commission Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {AFFILIATE_TIERS.map((tier) => (
              <div 
                key={tier.name}
                className={`p-4 rounded-lg border ${
                  tier.name === currentTier.name 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-border'
                } ${tier.color}`}
              >
                <div className="text-center space-y-2">
                  <Badge variant="outline">{tier.name}</Badge>
                  <p className="text-2xl font-bold text-primary">{tier.commission}%</p>
                  <p className="text-xs text-muted-foreground">
                    {tier.minReferrals}+ referrals
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Request */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold">Ready to cash out?</h4>
              <p className="text-sm text-muted-foreground">
                Minimum payout: $50 • Payouts processed monthly via PayPal or Payoneer
              </p>
            </div>
            <Button 
              disabled={stats.pendingPayout < 50}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
