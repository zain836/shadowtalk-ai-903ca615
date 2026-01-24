import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Copy, Check, ExternalLink, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const FounderAccessPage = () => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const eliteFeatures = [
    { icon: Plane, text: "100% Offline Mode (Airplane Mode)" },
    { icon: Lock, text: "Stealth Mode & Encrypted Vault" },
    { icon: Bot, text: "Agentic Task Runners" },
    { icon: Palette, text: "White-Label Branding" },
    { icon: Zap, text: "Priority Support & Updates" },
    { icon: Crown, text: "Lifetime Access - No Renewals" }
  ];

  const whatsappMessage = encodeURIComponent(
    "Salam! I just transferred the $39.99 for the Elite Founding Membership. Here is my receipt screenshot. My account email is: [Your Email]"
  );

  const internationalWhatsappMessage = encodeURIComponent(
    "I am an International Founder. I have sent [Amount] via [Crypto/Wise]. Here is my TXID/Screenshot. Please activate my Elite Node."
  );

  const whatsappLink = `https://wa.me/923211798561?text=${whatsappMessage}`;
  const internationalWhatsappLink = `https://wa.me/923211798561?text=${internationalWhatsappMessage}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Floating Particles Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Secure Founder Onboarding</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Claim Your Sovereign Node 🛡️
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Our automated gateway is currently upgrading to handle 160+ simultaneous users. 
            To ensure zero delay in your access, we are processing Founding Member payments via 
            <span className="text-primary font-semibold"> Direct Secure Settlement</span>.
          </p>

          {/* Scarcity Badge */}
          <motion.div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-bold text-amber-500">
              LIVE: {slotsRemaining}/{totalSlots} FOUNDING SLOTS REMAINING
            </span>
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div 
          className="max-w-md mx-auto mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Founding Member Slots</span>
            <span className="text-primary font-semibold">{100 - (slotsRemaining * 10)}% Claimed</span>
          </div>
          <Progress value={progressPercent * 10} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚡ Slots are filling fast — Secure yours now
          </p>
        </motion.div>

        {/* Elite Plan Card */}
        <motion.div 
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-background to-primary/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            
            <CardHeader className="text-center pb-4">
              <Badge className="w-fit mx-auto mb-2 bg-gradient-to-r from-amber-500 to-orange-500">
                <Crown className="w-3 h-3 mr-1" />
                ELITE TIER
              </Badge>
              <CardTitle className="text-2xl">Lifetime Elite Access</CardTitle>
              <div className="flex items-center justify-center gap-3 mt-4">
                <span className="text-2xl text-muted-foreground line-through">$49.99</span>
                <span className="text-5xl font-bold text-primary">$39.99</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                  20% OFF
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Founder's Discount • One-time payment</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eliteFeatures.map((feature, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <feature.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs">{feature.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-center mb-2">Direct Settlement Methods</h2>
          <p className="text-muted-foreground text-center mb-8">Choose your preferred payment method</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                  <DetailRow 
                    label="Reference" 
                    value={bankDetails.reference}
                    onCopy={() => copyToClipboard(bankDetails.reference, "Reference")}
                    copied={copiedField === "Reference"}
                    highlight
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
                <Badge variant="outline" className="w-fit mb-2 bg-green-500/10 text-green-500 border-green-500/30">
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
                <div className="pt-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-500">
                    💡 Tip: Send exactly PKR 11,150 (~$39.99 USD)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Crypto/International Card */}
            <Card className="relative overflow-hidden hover:border-primary/50 transition-colors md:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-3">
                <Globe className="w-8 h-8 text-primary/20" />
              </div>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2 bg-purple-500/10 text-purple-500 border-purple-500/30">
                  <Globe className="w-3 h-3 mr-1" />
                  International
                </Badge>
                <CardTitle className="text-lg">Global Founders</CardTitle>
                <CardDescription>Crypto & Wire Transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Crypto Section */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-orange-500" />
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
                  <DetailRow 
                    label="IBAN" 
                    value={internationalDetails.iban}
                    onCopy={() => copyToClipboard(internationalDetails.iban, "Intl IBAN")}
                    copied={copiedField === "Intl IBAN"}
                    mono
                    small
                  />
                </div>

                <div className="pt-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-400">
                    🌍 Support decentralized intelligence. Your membership funds offline-first AI for emerging markets.
                  </p>
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
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Confirmation Workflow
              </CardTitle>
              <CardDescription>Complete these steps to activate your Elite Node</CardDescription>
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
                  className="group bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
                  onClick={() => window.open(whatsappLink, '_blank')}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Upload Receipt & Activate Node
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                International users: 
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-purple-400 h-auto p-0 ml-1"
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
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
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
          <Check className="w-3 h-3 text-green-500" />
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
