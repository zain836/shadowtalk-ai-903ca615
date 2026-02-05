import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Shield, Copy, Check, ExternalLink, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight, Star,
  Coins, Code, FileText, Users, Rocket, Timer, Sparkles,
  CreditCard, BadgeCheck, Clock, ChevronRight, Landmark,
  QrCode, ShieldCheck, Verified, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { 
  SUBSCRIPTION_TIERS, 
  CREDIT_PACKAGES, 
  PAY_PER_SOLUTIONS,
  API_PLANS,
  WHITELABEL_PLANS,
  LIFETIME_DEAL
} from "@/lib/monetization";
import Navigation from "@/components/Navigation";

const FounderAccessPage = () => {
  const { toast } = useToast();
  const { userPlan } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("elite");
  const [activePaymentMethod, setActivePaymentMethod] = useState<string>("bank");

  const slotsRemaining = LIFETIME_DEAL.slotsRemaining;
  const totalSlots = LIFETIME_DEAL.slotsTotal;
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
      case 'elite': 
      case 'lifetime': return Crown;
      default: return Zap;
    }
  };

  const getSelectedProduct = () => {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === selectedTier);
    if (tier) return { name: tier.name, price: tier.price, period: tier.period };
    
    const creditPkg = CREDIT_PACKAGES.find(p => `credits-${p.id}` === selectedTier);
    if (creditPkg) return { name: `${creditPkg.credits} Credits`, price: creditPkg.price, period: 'one-time' };
    
    const solution = PAY_PER_SOLUTIONS.find(s => `solution-${s.id}` === selectedTier);
    if (solution) return { name: solution.name, price: solution.priceRange, period: 'one-time' };
    
    const apiPlan = API_PLANS.find(p => `api-${p.id}` === selectedTier);
    if (apiPlan) return { name: apiPlan.name, price: apiPlan.price, period: '/month' };
    
    const wlPlan = WHITELABEL_PLANS.find(p => `wl-${p.id}` === selectedTier);
    if (wlPlan) return { name: wlPlan.name, price: wlPlan.price, period: wlPlan.period };
    
    return { name: 'Elite', price: 20, period: '/month' };
  };

  const selectedProduct = getSelectedProduct();

  const paymentMethods = [
    { id: 'bank', name: 'Bank Transfer', icon: Landmark, badge: 'Local', color: 'from-blue-500/20 to-blue-600/10' },
    { id: 'mobile', name: 'Mobile Wallet', icon: Smartphone, badge: 'Instant', color: 'from-green-500/20 to-green-600/10' },
    { id: 'crypto', name: 'Crypto (USDT)', icon: Wallet, badge: 'Global', color: 'from-amber-500/20 to-amber-600/10' },
    { id: 'wire', name: 'Wire Transfer', icon: Globe, badge: 'International', color: 'from-purple-500/20 to-purple-600/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      <div className="relative pt-20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          
          {/* Compact Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Secure Checkout</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-muted-foreground">Select your plan and payment method below</p>
          </motion.div>

          {/* Main Layout: 2 Column on Desktop */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Plan Selection & Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Lifetime Deal Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link to="/lifetime-deal">
                  <Card className="group border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-pink-500/10 hover:border-amber-500/50 transition-all overflow-hidden">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge className="bg-destructive text-white text-xs">LIMITED</Badge>
                            <span className="text-sm font-semibold text-amber-500">{slotsRemaining} spots left</span>
                          </div>
                          <h3 className="font-bold">$99 Lifetime Deal — Everything, Forever</h3>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        View <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

              {/* Plan Selection Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Select Your Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="subscriptions">
                      <TabsList className="grid grid-cols-5 mb-6">
                        <TabsTrigger value="subscriptions" className="text-xs">Plans</TabsTrigger>
                        <TabsTrigger value="credits" className="text-xs">Credits</TabsTrigger>
                        <TabsTrigger value="solutions" className="text-xs">Solutions</TabsTrigger>
                        <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
                        <TabsTrigger value="whitelabel" className="text-xs">License</TabsTrigger>
                      </TabsList>

                      {/* Subscriptions Tab */}
                      <TabsContent value="subscriptions" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map((tier) => {
                            const Icon = getTierIcon(tier.id);
                            const isSelected = selectedTier === tier.id;
                            
                            return (
                              <motion.div
                                key={tier.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Card 
                                  className={`cursor-pointer transition-all h-full ${
                                    isSelected 
                                      ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                                      : 'hover:border-primary/50'
                                  }`}
                                  onClick={() => setSelectedTier(tier.id)}
                                >
                                  <CardContent className="p-4 text-center">
                                    <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    }`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-semibold text-sm">{tier.name}</h4>
                                    <div className="mt-1">
                                      <span className="text-xl font-bold">${tier.price}</span>
                                      <span className="text-xs text-muted-foreground">{tier.period}</span>
                                    </div>
                                    {tier.badge && (
                                      <Badge variant="secondary" className="mt-2 text-xs">{tier.badge}</Badge>
                                    )}
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* Credits Tab */}
                      <TabsContent value="credits" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {CREDIT_PACKAGES.map((pkg) => {
                            const isSelected = selectedTier === `credits-${pkg.id}`;
                            return (
                              <Card 
                                key={pkg.id}
                                className={`cursor-pointer transition-all ${
                                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedTier(`credits-${pkg.id}`)}
                              >
                                <CardContent className="p-4 text-center">
                                  <Coins className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-amber-500'}`} />
                                  <h4 className="font-semibold text-sm">{pkg.name}</h4>
                                  <div className="text-2xl font-bold">{pkg.credits.toLocaleString()}</div>
                                  <p className="text-xs text-muted-foreground">credits</p>
                                  {pkg.bonus > 0 && (
                                    <Badge variant="outline" className="mt-2 text-xs text-success border-success">
                                      +{pkg.bonus} bonus
                                    </Badge>
                                  )}
                                  <div className="text-lg font-bold mt-2">${pkg.price}</div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* Solutions Tab */}
                      <TabsContent value="solutions" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {PAY_PER_SOLUTIONS.map((solution) => {
                            const isSelected = selectedTier === `solution-${solution.id}`;
                            return (
                              <Card 
                                key={solution.id}
                                className={`cursor-pointer transition-all ${
                                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedTier(`solution-${solution.id}`)}
                              >
                                <CardContent className="p-4">
                                  <span className="text-2xl">{solution.icon}</span>
                                  <h4 className="font-semibold mt-2">{solution.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">{solution.description}</p>
                                  <Badge variant="secondary" className="mt-3">{solution.priceRange}</Badge>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* API Tab */}
                      <TabsContent value="api" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {API_PLANS.map((plan) => {
                            const isSelected = selectedTier === `api-${plan.id}`;
                            return (
                              <Card 
                                key={plan.id}
                                className={`cursor-pointer transition-all ${
                                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedTier(`api-${plan.id}`)}
                              >
                                <CardContent className="p-4 text-center">
                                  <Code className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-green-500'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></div>
                                  <p className="text-xs text-muted-foreground mt-2">{plan.requestsPerMonth.toLocaleString()} req/mo</p>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* White-Label Tab */}
                      <TabsContent value="whitelabel" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {WHITELABEL_PLANS.map((plan) => {
                            const isSelected = selectedTier === `wl-${plan.id}`;
                            return (
                              <Card 
                                key={plan.id}
                                className={`cursor-pointer transition-all ${
                                  isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedTier(`wl-${plan.id}`)}
                              >
                                <CardContent className="p-4 text-center">
                                  <Palette className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-purple-500'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">{plan.period}</span></div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Methods */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Payment Method Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isActive = activePaymentMethod === method.id;
                        return (
                          <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActivePaymentMethod(method.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                              isActive 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <Badge 
                              variant="secondary" 
                              className={`absolute -top-2 -right-2 text-xs ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
                            >
                              {method.badge}
                            </Badge>
                            <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {method.name}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Payment Details */}
                    <div className="bg-muted/50 rounded-xl p-5 border">
                      {activePaymentMethod === 'bank' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Landmark className="w-5 h-5 text-primary" />
                            <h4 className="font-semibold">Bank Transfer Details</h4>
                          </div>
                          <PaymentDetailRow 
                            label="Bank Name" 
                            value={bankDetails.bankName}
                            onCopy={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                            copied={copiedField === "Bank Name"}
                          />
                          <PaymentDetailRow 
                            label="Account Title" 
                            value={bankDetails.accountName}
                            onCopy={() => copyToClipboard(bankDetails.accountName, "Account Name")}
                            copied={copiedField === "Account Name"}
                          />
                          <PaymentDetailRow 
                            label="IBAN" 
                            value={bankDetails.iban}
                            onCopy={() => copyToClipboard(bankDetails.iban, "IBAN")}
                            copied={copiedField === "IBAN"}
                            mono
                          />
                        </div>
                      )}

                      {activePaymentMethod === 'mobile' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Smartphone className="w-5 h-5 text-green-500" />
                            <h4 className="font-semibold">Mobile Wallet</h4>
                          </div>
                          <PaymentDetailRow 
                            label="EasyPaisa" 
                            value={mobileWallet.easypaisa}
                            onCopy={() => copyToClipboard(mobileWallet.easypaisa, "EasyPaisa")}
                            copied={copiedField === "EasyPaisa"}
                            mono
                          />
                          <PaymentDetailRow 
                            label="JazzCash" 
                            value={mobileWallet.jazzcash}
                            onCopy={() => copyToClipboard(mobileWallet.jazzcash, "JazzCash")}
                            copied={copiedField === "JazzCash"}
                            mono
                          />
                          <PaymentDetailRow 
                            label="Account Title" 
                            value={mobileWallet.name}
                            onCopy={() => copyToClipboard(mobileWallet.name, "Wallet Name")}
                            copied={copiedField === "Wallet Name"}
                          />
                        </div>
                      )}

                      {activePaymentMethod === 'crypto' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Wallet className="w-5 h-5 text-amber-500" />
                            <h4 className="font-semibold">USDT (TRC20)</h4>
                          </div>
                          <PaymentDetailRow 
                            label="Network" 
                            value={cryptoDetails.network}
                            onCopy={() => copyToClipboard(cryptoDetails.network, "Network")}
                            copied={copiedField === "Network"}
                          />
                          <PaymentDetailRow 
                            label="Address" 
                            value={cryptoDetails.usdt}
                            onCopy={() => copyToClipboard(cryptoDetails.usdt, "USDT Address")}
                            copied={copiedField === "USDT Address"}
                            mono
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            ⚠️ Only send USDT on the Tron (TRC20) network
                          </p>
                        </div>
                      )}

                      {activePaymentMethod === 'wire' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Globe className="w-5 h-5 text-purple-500" />
                            <h4 className="font-semibold">International Wire Transfer</h4>
                          </div>
                          <PaymentDetailRow 
                            label="Bank" 
                            value={internationalDetails.bankName}
                            onCopy={() => copyToClipboard(internationalDetails.bankName, "Int Bank")}
                            copied={copiedField === "Int Bank"}
                          />
                          <PaymentDetailRow 
                            label="SWIFT/BIC" 
                            value={internationalDetails.swift}
                            onCopy={() => copyToClipboard(internationalDetails.swift, "SWIFT")}
                            copied={copiedField === "SWIFT"}
                            mono
                          />
                          <PaymentDetailRow 
                            label="IBAN" 
                            value={internationalDetails.iban}
                            onCopy={() => copyToClipboard(internationalDetails.iban, "Int IBAN")}
                            copied={copiedField === "Int IBAN"}
                            mono
                          />
                          <PaymentDetailRow 
                            label="Account Title" 
                            value={internationalDetails.accountName}
                            onCopy={() => copyToClipboard(internationalDetails.accountName, "Int Name")}
                            copied={copiedField === "Int Name"}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Use Wise or Remitly for lower fees
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Order Summary (Sticky) */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="sticky top-24"
              >
                <Card className="border-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Order Summary
                    </h3>
                  </div>
                  
                  <CardContent className="p-5 space-y-5">
                    {/* Selected Plan */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{selectedProduct.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedProduct.period === 'one-time' ? 'One-time purchase' : `Billed ${selectedProduct.period?.replace('/', '')}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : selectedProduct.price}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Steps */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">How to Complete</h4>
                      <div className="space-y-3">
                        <StepItem number={1} title="Send Payment" description="Transfer the amount using your selected method" />
                        <StepItem number={2} title="Screenshot Receipt" description="Take a clear photo of your payment confirmation" />
                        <StepItem number={3} title="Send on WhatsApp" description="Upload receipt for instant activation" />
                      </div>
                    </div>

                    <Separator />

                    {/* CTA Button */}
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-success to-green-600 hover:from-success/90 hover:to-green-600/90 text-white font-semibold"
                      onClick={() => window.open(whatsappLink, '_blank')}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Complete on WhatsApp
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(internationalWhatsappLink, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      International Users
                    </Button>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <ShieldCheck className="w-5 h-5 mx-auto text-success mb-1" />
                        <p className="text-xs text-muted-foreground">Secure</p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
                        <p className="text-xs text-muted-foreground">Instant</p>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded-lg">
                        <Verified className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                        <p className="text-xs text-muted-foreground">Verified</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="mt-4 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Need Help?</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Contact us on WhatsApp for instant support with your purchase.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Footer Trust Bar */}
          <motion.div 
            className="flex items-center justify-center gap-8 mt-12 py-6 border-t text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BadgeCheck className="w-4 h-4 text-amber-500" />
              <span>Verified Business</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper Components  
const PaymentDetailRow = ({ 
  label, value, onCopy, copied, mono = false 
}: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3 p-3 bg-background rounded-lg border">
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium truncate ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
      </p>
    </div>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 shrink-0"
      onClick={onCopy}
    >
      {copied ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  </div>
);

const StepItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {number}
    </div>
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default FounderAccessPage;
