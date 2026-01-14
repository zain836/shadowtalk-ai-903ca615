import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  successful_conversions: number;
  total_earnings: number;
}

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  commission_amount: number;
  created_at: string;
  converted_at: string | null;
}

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      // Get or create referral code
      let { data: codeData, error: codeError } = await supabase
        .from('user_referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!codeData && !codeError) {
        // Create new referral code
        const newCode = `ST${user.id.slice(0, 8).toUpperCase()}`;
        const { data: newCodeData, error: insertError } = await supabase
          .from('user_referral_codes')
          .insert({
            user_id: user.id,
            referral_code: newCode,
          })
          .select()
          .single();

        if (!insertError) {
          codeData = newCodeData;
        }
      }

      if (codeData) {
        setStats({
          referral_code: codeData.referral_code,
          total_referrals: codeData.total_referrals || 0,
          successful_conversions: codeData.successful_conversions || 0,
          total_earnings: Number(codeData.total_earnings) || 0,
        });
      }

      // Get referral history
      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralData) {
        setReferrals(referralData as Referral[]);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!stats?.referral_code) return;
    
    const link = `${window.location.origin}?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'signed_up':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Signed Up</Badge>;
      case 'subscribed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Subscribed</Badge>;
      case 'paid_out':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Paid Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Referral Program</CardTitle>
              <p className="text-sm text-muted-foreground">
                Earn 20% commission on every successful referral
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={stats?.referral_code ? `${window.location.origin}?ref=${stats.referral_code}` : 'Loading...'}
                  className="bg-background/50"
                />
                <Button onClick={copyReferralLink} variant="outline">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Referral Code:</span>
              <Badge variant="outline" className="font-mono">
                {stats?.referral_code || '...'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.successful_conversions || 0}</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <DollarSign className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats?.total_earnings?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h4 className="font-medium mb-1">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">
                Share your unique referral link with friends, colleagues, or on social media
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h4 className="font-medium mb-1">They Subscribe</h4>
              <p className="text-sm text-muted-foreground">
                When someone signs up using your link and subscribes to a paid plan
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h4 className="font-medium mb-1">Earn Commission</h4>
              <p className="text-sm text-muted-foreground">
                You earn 20% of their first payment, paid out monthly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{referral.referred_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {referral.commission_amount > 0 && (
                      <span className="text-sm font-medium text-green-400">
                        +${referral.commission_amount.toFixed(2)}
                      </span>
                    )}
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralProgram;