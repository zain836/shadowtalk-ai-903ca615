import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Copy, Check, ExternalLink, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight, Star,
  Coins, Code, FileText, Users, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { 
  SUBSCRIPTION_TIERS, 
  CREDIT_PACKAGES, 
  PAY_PER_SOLUTIONS,
  API_PLANS,
  WHITELABEL_PLANS 
} from "@/lib/monetization";

const FounderAccessPage = () => {
  const { toast } = useToast();
  const { userPlan } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("elite");

  const slotsRemaining = 7;
  const totalSlots = 10;
  const progressPercent = ((totalSlots - slotsRemaining) / totalSlots) * 100;

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
    reference: "ShadowTalk-Elite"
  };

  const mobileWallet = {
    easypaisa: "03211798561",
    jazzcash: "03211798561",
    name: "ShadowTalk AI"
  };

  const cryptoDetails = {
    usdt: "TKfKJ7ESFcnMTd2F1DkrvZ4buCWneAmHqz",
    network: "Tron (TRC20)"
  };

  const internationalDetails = {
    swift: "MEZN PK KA",
    iban: "PK08 MEZN 0099 1701 1274 9131",
    bankName: "Meezan Bank Limited",
    accountName: "ShadowTalk AI"
  };

  const whatsappMessage = encodeURIComponent(
    `Salam! I want to purchase ${selectedTier.toUpperCase()} plan. Here is my receipt screenshot. My account email is: [Your Email]`
  );

  const internationalWhatsappMessage = encodeURIComponent(
    "I am an International Founder. I have sent [Amount] via [Crypto/Wise]. Here is my TXID/Screenshot. Please activate my account."
  );

  const whatsappLink = `https://wa.me/923211798561?text=${whatsappMessage}`;
  const internationalWhatsappLink = `https://wa.me/923211798561?text=${internationalWhatsappMessage}`;

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'free': return Zap;
      case 'pro': return Star;
      case 'premium': return Rocket;
      case 'elite': return Crown;
      default: return Zap;
    }
  };

  const getTierPrice = (tier: typeof SUBSCRIPTION_TIERS[0]) => {
    if (tier.id === 'elite') return { pkr: '11,150', usd: '39.99' };
    if (tier.id === 'premium') return { pkr: '8,400', usd: '29.99' };
    if (tier.id === 'pro') return { pkr: '2,800', usd: '9.99' };
    return { pkr: '0', usd: '0' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Floating Particles Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) 
            }}
            animate={{ 
              y: [null, Math.random() * -500],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Secure Payment Portal</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Complete Your Purchase 🛡️
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All subscriptions, credits, and solutions are processed through our 
            <span className="text-primary font-semibold"> Direct Secure Settlement</span> system.
          </p>
        </motion.div>

        {/* Products Tab Navigation */}
        <Tabs defaultValue="subscriptions" className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full max-w-3xl mx-auto mb-8">
            <TabsTrigger value="subscriptions" className="gap-1">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Plans</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="gap-1">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Credits</span>
            </TabsTrigger>
            <TabsTrigger value="solutions" className="gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Solutions</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1">
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="whitelabel" className="gap-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">License</span>
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map((tier) => {
                const Icon = getTierIcon(tier.id);
                const prices = getTierPrice(tier);
                const isSelected = selectedTier === tier.id;
                const isElite = tier.id === 'elite';
                
                return (
                  <Card 
                    key={tier.id}
                    className={`relative cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/50'
                    } ${isElite ? 'bg-gradient-to-br from-primary/10 to-transparent' : ''}`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.badge && (
                      <Badge className={`absolute -top-2 left-1/2 -translate-x-1/2 ${
                        isElite ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-primary'
                      }`}>
                        {tier.badge}
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center pb-2 pt-6">
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                        isElite ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-primary/20'
                      }`}>
                        <Icon className={`w-6 h-6 ${isElite ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-primary">${tier.price}</span>
                        <span className="text-muted-foreground text-sm">{tier.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        PKR {prices.pkr}
                      </p>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-1.5">
                        {tier.features.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-success shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {tier.features.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{tier.features.length - 4} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`relative transition-all hover:shadow-lg cursor-pointer ${
                    pkg.popular ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTier(`credits-${pkg.id}`)}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      Best Value
                    </Badge>
                  )}
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 mx-auto mb-3 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-amber-500" />
                    </div>
                    <h4 className="font-semibold mb-1">{pkg.name}</h4>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {pkg.credits.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">credits</p>
                    {pkg.bonus > 0 && (
                      <Badge variant="outline" className="text-success border-success mb-3">
                        +{pkg.bonus} bonus
                      </Badge>
                    )}
                    <div className="text-2xl font-bold">${pkg.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Solutions Tab */}
          <TabsContent value="solutions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PAY_PER_SOLUTIONS.map((solution) => (
                <Card 
                  key={solution.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedTier(`solution-${solution.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-3">{solution.icon}</div>
                    <h4 className="font-semibold mb-2">{solution.name}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{solution.description}</p>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {solution.priceRange}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {API_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedTier(`api-${plan.id}`)}
                >
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 mx-auto mb-2 flex items-center justify-center">
                      <Code className="w-6 h-6 text-green-500" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-success shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* White-Label Tab */}
          <TabsContent value="whitelabel">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {WHITELABEL_PLANS.map((plan) => (
                <Card 
                  key={plan.id}
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedTier(`wl-${plan.id}`)}
                >
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 mx-auto mb-2 flex items-center justify-center">
                      <Palette className="w-6 h-6 text-purple-500" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-primary">${plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-success shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Scarcity Badge for Elite */}
        {selectedTier === 'elite' && (
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-destructive/10 border border-amber-500/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-bold text-amber-500">
                LIVE: {slotsRemaining}/{totalSlots} FOUNDING SLOTS REMAINING
              </span>
            </div>
          </motion.div>
        )}

        {/* Payment Methods Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-center mb-2">Payment Methods</h2>
          <p className="text-muted-foreground text-center mb-6">Choose your preferred payment method</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Bank Transfer Card */}
            <Card className="relative overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 p-3">
                <Building2 className="w-8 h-8 text-primary/20" />
              </div>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  <Building2 className="w-3 h-3 mr-1" />
                  Local Bank
                </Badge>
                <CardTitle className="text-lg">Standard Bank Transfer</CardTitle>
                <CardDescription>For Pakistani residents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <DetailRow 
                    label="Bank" 
                    value={bankDetails.bankName}
                    onCopy={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                    copied={copiedField === "Bank Name"}
                  />
                  <DetailRow 
                    label="Account Name" 
                    value={bankDetails.accountName}
                    onCopy={() => copyToClipboard(bankDetails.accountName, "Account Name")}
                    copied={copiedField === "Account Name"}
                  />
                  <DetailRow 
                    label="IBAN" 
                    value={bankDetails.iban}
                    onCopy={() => copyToClipboard(bankDetails.iban, "IBAN")}
                    copied={copiedField === "IBAN"}
                    mono
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mobile Wallet Card */}
            <Card className="relative overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute top-0 right-0 p-3">
                <Smartphone className="w-8 h-8 text-primary/20" />
              </div>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-success/10 text-success border-success/30">
                  <Smartphone className="w-3 h-3 mr-1" />
                  Mobile Wallet
                </Badge>
                <CardTitle className="text-lg">EasyPaisa / JazzCash</CardTitle>
                <CardDescription>Instant mobile transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <DetailRow 
                    label="EasyPaisa" 
                    value={mobileWallet.easypaisa}
                    onCopy={() => copyToClipboard(mobileWallet.easypaisa, "EasyPaisa")}
                    copied={copiedField === "EasyPaisa"}
                    mono
                  />
                  <DetailRow 
                    label="JazzCash" 
                    value={mobileWallet.jazzcash}
                    onCopy={() => copyToClipboard(mobileWallet.jazzcash, "JazzCash")}
                    copied={copiedField === "JazzCash"}
                    mono
                  />
                  <DetailRow 
                    label="Account Name" 
                    value={mobileWallet.name}
                    onCopy={() => copyToClipboard(mobileWallet.name, "Wallet Name")}
                    copied={copiedField === "Wallet Name"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Crypto/International Card */}
            <Card className="relative overflow-hidden hover:border-primary/50 transition-colors md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-3">
                <Globe className="w-8 h-8 text-primary/20" />
              </div>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-secondary/50 text-secondary-foreground border-secondary/30">
                  <Globe className="w-3 h-3 mr-1" />
                  International
                </Badge>
                <CardTitle className="text-lg">Global Payments</CardTitle>
                <CardDescription>Crypto & Wire Transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Crypto Section */}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-sm">USDT (TRC20)</span>
                  </div>
                  <DetailRow 
                    label="Address" 
                    value={cryptoDetails.usdt}
                    onCopy={() => copyToClipboard(cryptoDetails.usdt, "USDT Address")}
                    copied={copiedField === "USDT Address"}
                    mono
                    small
                  />
                </div>

                <Separator />

                {/* Wire Transfer Section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Wise / Remitly Transfer
                  </p>
                  <DetailRow 
                    label="SWIFT" 
                    value={internationalDetails.swift}
                    onCopy={() => copyToClipboard(internationalDetails.swift, "SWIFT")}
                    copied={copiedField === "SWIFT"}
                    mono
                    small
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Activation Section */}
        <motion.div 
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Confirmation Workflow
              </CardTitle>
              <CardDescription>Complete these steps to activate your purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <StepCard 
                  number={1} 
                  title="Make Transfer" 
                  description="Send payment using any method above"
                />
                <StepCard 
                  number={2} 
                  title="Screenshot Receipt" 
                  description="Capture proof of your payment"
                />
                <StepCard 
                  number={3} 
                  title="Upload & Activate" 
                  description="Send via WhatsApp for instant access"
                />
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70"
                  onClick={() => window.open(whatsappLink, '_blank')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Upload Receipt & Activate
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                International users: 
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary h-auto p-0 ml-1"
                  onClick={() => window.open(internationalWhatsappLink, '_blank')}
                >
                  Use this link instead <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust Footer */}
        <motion.div 
          className="text-center mt-12 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-center gap-6 text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-sm">256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm">Privacy First</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Instant Activation</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 ShadowTalk AI • Sovereign Intelligence Platform
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Helper Components
const DetailRow = ({ 
  label, 
  value, 
  onCopy, 
  copied, 
  mono = false,
  small = false,
  highlight = false
}: { 
  label: string; 
  value: string; 
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
  small?: boolean;
  highlight?: boolean;
}) => (
  <div className={`flex items-center justify-between gap-2 ${small ? 'text-xs' : ''}`}>
    <span className="text-muted-foreground shrink-0">{label}:</span>
    <div className="flex items-center gap-2 min-w-0">
      <span className={`truncate ${mono ? 'font-mono text-xs' : ''} ${highlight ? 'text-primary font-semibold' : ''}`}>
        {value}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 shrink-0"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="w-3 h-3 text-success" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </Button>
    </div>
  </div>
);

const StepCard = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="text-center p-4 rounded-lg bg-background/50 border border-border/50">
    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center mx-auto mb-2">
      {number}
    </div>
    <h4 className="font-semibold text-sm">{title}</h4>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
  </div>
);

export default FounderAccessPage;
