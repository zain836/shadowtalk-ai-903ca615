import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Copy, Check, ExternalLink, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight, Star,
  Coins, Code, FileText, Users, Rocket, Timer,
  Sparkles, Gift, TrendingUp, AlertTriangle, X,
  CheckCircle2, Clock, CreditCard, Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { LIFETIME_DEAL } from "@/lib/monetization";
import Navigation from "@/components/Navigation";

const LifetimeDealPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showUrgency, setShowUrgency] = useState(true);

  // Countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date(LIFETIME_DEAL.deadline);
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24) + Math.floor(difference / (1000 * 60 * 60 * 24)) * 24,
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const bankDetails = {
    bankName: "Meezan Bank",
    accountName: "ShadowTalk AI",
    iban: "PK08 MEZN 0099 1701 1274 9131",
  };

  const mobileWallet = {
    number: "03211798561",
    name: "ShadowTalk AI"
  };

  const cryptoDetails = {
    usdt: "TKfKJ7ESFcnMTd2F1DkrvZ4buCWneAmHqz",
    network: "Tron (TRC20)"
  };

  const whatsappMessage = encodeURIComponent(
    `🔥 LIFETIME DEAL PURCHASE 🔥\n\nI want to claim my $99 Lifetime Deal!\n\nEmail: ${user?.email || '[Your Email]'}\n\nPayment Method: [Bank/EasyPaisa/JazzCash/Crypto]\n\n[Attach receipt screenshot]`
  );
  const whatsappLink = `https://wa.me/923211798561?text=${whatsappMessage}`;

  const slotsProgress = ((LIFETIME_DEAL.slotsTotal - LIFETIME_DEAL.slotsRemaining) / LIFETIME_DEAL.slotsTotal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      {/* Urgency Banner */}
      <AnimatePresence>
        {showUrgency && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-16 z-40 bg-gradient-to-r from-destructive via-orange-500 to-amber-500 text-white"
          >
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 animate-pulse" />
                <span className="font-bold">⚡ TONIGHT ONLY: $99 Lifetime Deal</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {LIFETIME_DEAL.slotsRemaining} spots left
                </Badge>
              </div>
              <button onClick={() => setShowUrgency(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) 
            }}
            animate={{ 
              y: [null, Math.random() * -500],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              duration: 8 + Math.random() * 8, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-8 pt-24">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-500">🔥 LIMITED TIME OFFER • FIRST 100 USERS ONLY</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              $99 LIFETIME
            </span>
            <br />
            <span className="text-foreground">ACCESS</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-3xl text-muted-foreground line-through">$999</span>
            <span className="text-6xl font-black text-primary">$99</span>
            <Badge className="bg-success text-white text-lg px-3 py-1">90% OFF</Badge>
          </div>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get <span className="text-primary font-bold">EVERYTHING</span> ShadowTalk AI offers. 
            Forever. One payment. No subscriptions. No renewals.
          </p>

          {/* Scarcity Counter */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Spots claimed</span>
              <span className="font-bold text-destructive">
                {LIFETIME_DEAL.slotsTotal - LIFETIME_DEAL.slotsRemaining} / {LIFETIME_DEAL.slotsTotal}
              </span>
            </div>
            <Progress value={slotsProgress} className="h-3 bg-muted" />
            <p className="text-sm text-amber-500 mt-2 font-medium">
              ⚠️ Only {LIFETIME_DEAL.slotsRemaining} spots remaining at this price!
            </p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Features List - 3 columns */}
          <div className="lg:col-span-3">
            <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Gift className="w-6 h-6 text-primary" />
                  Everything You Get
                </CardTitle>
                <CardDescription>Lifetime access to all features - no exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {LIFETIME_DEAL.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                    >
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* What's NOT included */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    Not included (Admin only)
                  </h4>
                  {LIFETIME_DEAL.notIncluded.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <X className="w-3 h-3" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Price Card */}
            <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 via-card to-purple-500/10">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-purple-500 mx-auto mb-4 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Lifetime Deal</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-primary">$99</span>
                  <span className="text-muted-foreground"> USD</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  ≈ PKR {LIFETIME_DEAL.pkrPrice.toLocaleString()}
                </p>
                <Badge className="bg-success/20 text-success border-success mb-4">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  One-time payment • Forever access
                </Badge>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Pay Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bank Transfer */}
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Bank Transfer</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank:</span>
                      <span>{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">IBAN:</span>
                      <button 
                        onClick={() => copyToClipboard(bankDetails.iban, "IBAN")}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        {bankDetails.iban.slice(0, 15)}...
                        {copiedField === "IBAN" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Wallets */}
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm">EasyPaisa / JazzCash</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Number:</span>
                    <button 
                      onClick={() => copyToClipboard(mobileWallet.number, "Mobile")}
                      className="flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      {mobileWallet.number}
                      {copiedField === "Mobile" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Crypto */}
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Bitcoin className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold text-sm">USDT (TRC20)</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(cryptoDetails.usdt, "USDT")}
                    className="w-full text-left text-xs font-mono p-2 rounded bg-background break-all flex items-start justify-between gap-2"
                  >
                    <span className="text-muted-foreground">{cryptoDetails.usdt}</span>
                    {copiedField === "USDT" ? <Check className="w-3 h-3 shrink-0 text-success" /> : <Copy className="w-3 h-3 shrink-0" />}
                  </button>
                </div>

                <Separator />

                {/* WhatsApp Button */}
                <Button 
                  asChild 
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Receipt on WhatsApp
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  After payment, send your receipt screenshot via WhatsApp.
                  <br />We'll activate your account within 30 minutes!
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <Shield className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <span className="text-xs text-muted-foreground">Secure</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <span className="text-xs text-muted-foreground">Instant</span>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="text-xs text-muted-foreground">Lifetime</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {[
              { 
                q: "Is this really a one-time payment?", 
                a: "Yes! Pay $99 once and get lifetime access. No monthly fees, no renewals, no hidden charges. Ever." 
              },
              { 
                q: "What happens after the 100 spots are filled?", 
                a: "The price goes up to $999/lifetime or $39.99/month. This deal will never be offered again at this price." 
              },
              { 
                q: "Do I get future updates?", 
                a: "Absolutely! All future features, improvements, and updates are included for life." 
              },
              { 
                q: "How fast will my account be activated?", 
                a: "Within 30 minutes during business hours. Usually within 5-10 minutes for WhatsApp confirmations." 
              },
              { 
                q: "Can I use this for my business?", 
                a: "Yes! You can use ShadowTalk AI for personal and commercial projects. White-label branding is included." 
              },
            ].map((faq, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <Card className="max-w-xl mx-auto border-2 border-primary bg-gradient-to-br from-primary/10 to-purple-500/10 p-8">
            <h3 className="text-2xl font-bold mb-4">Don't Miss This!</h3>
            <p className="text-muted-foreground mb-6">
              {LIFETIME_DEAL.slotsRemaining} spots left at $99. After that, it's $999 or $39.99/month.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="h-14 text-lg px-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:opacity-90"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Rocket className="w-5 h-5 mr-2" />
                Claim My Lifetime Deal Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              🔒 Secure payment • ⚡ Instant activation • 💯 Lifetime access
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LifetimeDealPage;
