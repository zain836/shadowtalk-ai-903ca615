import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Shield, Copy, Check, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight, Star,
  Coins, Code, FileText, Users, Rocket, Timer, Sparkles,
  CreditCard, BadgeCheck, Clock, ChevronRight, Landmark,
  ShieldCheck, Verified, ArrowUpRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    { id: 'bank', name: 'Bank Transfer', icon: Landmark, badge: 'Local', desc: 'Meezan Bank' },
    { id: 'mobile', name: 'Mobile Wallet', icon: Smartphone, badge: 'Instant', desc: 'EasyPaisa / JazzCash' },
    { id: 'crypto', name: 'Crypto', icon: Wallet, badge: 'Global', desc: 'USDT (TRC20)' },
    { id: 'wire', name: 'Wire Transfer', icon: Globe, badge: 'International', desc: 'SWIFT / Wise' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />
      
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--secondary)/0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative pt-20">
        <motion.div 
          className="container max-w-7xl mx-auto px-4 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Header */}
          <motion.div className="text-center mb-10" variants={itemVariants}>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[hsl(var(--border))] mb-5"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Secure Checkout</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Founder's <span className="gradient-text">Vault</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Select your plan and complete payment to unlock your access
            </p>
          </motion.div>

          {/* Lifetime Deal Banner */}
          <motion.div variants={itemVariants} className="mb-8">
            <Link to="/lifetime-deal">
              <motion.div 
                className="group relative rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(40_95%_55%/0.08)] via-[hsl(var(--card))] to-[hsl(315_90%_58%/0.06)] p-[1px]"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-[hsl(var(--card)/0.8)] backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(var(--accent))] flex items-center justify-center shrink-0 shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-[10px] uppercase tracking-wider font-bold border-0">Limited</Badge>
                        <span className="text-sm font-semibold text-[hsl(var(--warning))]">{slotsRemaining} of {totalSlots} spots left</span>
                      </div>
                      <h3 className="font-bold text-foreground">$99 Lifetime Deal — Everything, Forever</h3>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0 gap-1 group-hover:bg-[hsl(var(--warning))] group-hover:text-[hsl(var(--primary-foreground))] transition-colors hidden md:flex">
                    View Deal <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                {/* Progress bar */}
                <div className="h-0.5 bg-[hsl(var(--muted))]">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[hsl(var(--warning))] to-[hsl(var(--accent))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            
            {/* Left Column - Plan Selection & Payment Methods */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Plan Selection */}
              <motion.div variants={itemVariants}>
                <Card className="glass border-[hsl(var(--border))] overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                    <CardTitle className="text-base flex items-center gap-2 font-semibold">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Choose Your Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Tabs defaultValue="subscriptions">
                      <TabsList className="grid grid-cols-5 mb-5 bg-[hsl(var(--muted))] p-1 rounded-xl">
                        <TabsTrigger value="subscriptions" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Plans</TabsTrigger>
                        <TabsTrigger value="credits" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Credits</TabsTrigger>
                        <TabsTrigger value="solutions" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Solutions</TabsTrigger>
                        <TabsTrigger value="api" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">API</TabsTrigger>
                        <TabsTrigger value="whitelabel" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">License</TabsTrigger>
                      </TabsList>

                      {/* Subscriptions Tab */}
                      <TabsContent value="subscriptions" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map((tier) => {
                            const Icon = getTierIcon(tier.id);
                            const isSelected = selectedTier === tier.id;
                            const isElite = tier.id === 'elite';
                            
                            return (
                              <motion.div
                                key={tier.id}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div 
                                  className={`relative cursor-pointer rounded-xl p-4 text-center transition-all border-2 ${
                                    isSelected 
                                      ? 'border-primary bg-[hsl(var(--primary)/0.08)] shadow-[0_0_24px_hsl(var(--primary)/0.15)]' 
                                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(tier.id)}
                                >
                                  {isElite && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                      <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-[hsl(var(--primary-foreground))] text-[10px] uppercase tracking-wider border-0 shadow-[var(--shadow-button)]">
                                        Popular
                                      </Badge>
                                    </div>
                                  )}
                                  <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground shadow-[var(--shadow-button)]' 
                                      : 'bg-[hsl(var(--muted))] text-muted-foreground'
                                  }`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <h4 className="font-semibold text-sm">{tier.name}</h4>
                                  <div className="mt-1.5">
                                    <span className="text-2xl font-bold">${tier.price}</span>
                                    <span className="text-xs text-muted-foreground">{tier.period}</span>
                                  </div>
                                  {isSelected && (
                                    <motion.div 
                                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
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
                              <motion.div key={pkg.id} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)] shadow-[0_0_24px_hsl(var(--primary)/0.15)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`credits-${pkg.id}`)}
                                >
                                  <Coins className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--warning))]'}`} />
                                  <h4 className="font-semibold text-sm">{pkg.name}</h4>
                                  <div className="text-2xl font-bold mt-1">{pkg.credits.toLocaleString()}</div>
                                  <p className="text-xs text-muted-foreground">credits</p>
                                  {pkg.bonus > 0 && (
                                    <Badge variant="outline" className="mt-2 text-[10px] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]">
                                      +{pkg.bonus} bonus
                                    </Badge>
                                  )}
                                  <div className="text-lg font-bold mt-2">${pkg.price}</div>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
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
                              <motion.div key={solution.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`solution-${solution.id}`)}
                                >
                                  <span className="text-2xl">{solution.icon}</span>
                                  <h4 className="font-semibold mt-2">{solution.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{solution.description}</p>
                                  <Badge variant="secondary" className="mt-3">{solution.priceRange}</Badge>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
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
                              <motion.div key={plan.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`api-${plan.id}`)}
                                >
                                  <Code className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--success))]'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></div>
                                  <p className="text-xs text-muted-foreground mt-2">{plan.requestsPerMonth.toLocaleString()} req/mo</p>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
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
                              <motion.div key={plan.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`wl-${plan.id}`)}
                                >
                                  <Palette className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--secondary))]'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">{plan.period}</span></div>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

            </div>

            {/* Right Column - Order Summary (Sticky) */}
            <div className="lg:col-span-2">
              <motion.div
                variants={itemVariants}
                className="sticky top-24 space-y-4"
              >
                <Card className="border-2 border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
                  {/* Header gradient strip */}
                  <div className="h-1 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))]" />
                  
                  <div className="p-5 border-b border-[hsl(var(--border))]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Order Summary
                    </h3>
                  </div>
                  
                  <CardContent className="p-5 space-y-5">
                    {/* Selected Plan */}
                    <motion.div 
                      className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]"
                      layout
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedProduct.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedProduct.period === 'one-time' ? 'One-time purchase' : `Billed ${selectedProduct.period?.replace('/', '')}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <motion.p 
                            className="text-3xl font-bold gradient-text"
                            key={`${selectedProduct.price}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            {typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : selectedProduct.price}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>

                    <Separator className="bg-[hsl(var(--border))]" />

                    {/* Steps */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How to Complete</h4>
                      <div className="space-y-3">
                        <StepItem number={1} title="Send Payment" description="Transfer using your selected method" />
                        <StepItem number={2} title="Screenshot Receipt" description="Take a clear photo of confirmation" />
                        <StepItem number={3} title="Send on WhatsApp" description="Upload for instant activation" />
                      </div>
                    </div>

                    <Separator className="bg-[hsl(var(--border))]" />

                    {/* CTA */}
                    <div className="space-y-3">
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-[hsl(var(--success))] to-[hsl(150_80%_35%)] hover:opacity-90 text-white font-semibold gap-2 shadow-[0_4px_24px_hsl(var(--success)/0.3)]"
                          onClick={() => window.open(whatsappLink, '_blank')}
                        >
                          <MessageCircle className="w-5 h-5" />
                          Complete on WhatsApp
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </motion.div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full gap-2 border-[hsl(var(--border))] text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(internationalWhatsappLink, '_blank')}
                      >
                        <Globe className="w-4 h-4" />
                        International Users
                      </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[
                        { icon: ShieldCheck, label: "Secure", color: "text-[hsl(var(--success))]" },
                        { icon: Clock, label: "Instant", color: "text-primary" },
                        { icon: Verified, label: "Verified", color: "text-[hsl(var(--warning))]" },
                      ].map((badge) => (
                        <div key={badge.label} className="text-center p-2.5 rounded-lg bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
                          <badge.icon className={`w-4 h-4 mx-auto mb-1 ${badge.color}`} />
                          <p className="text-[10px] text-muted-foreground font-medium">{badge.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Need Help?</h4>
                        <p className="text-xs text-muted-foreground">
                          WhatsApp support for instant help
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
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 py-6 border-t border-[hsl(var(--border))]"
            variants={itemVariants}
          >
            {[
              { icon: Shield, label: "256-bit Encryption", color: "text-[hsl(var(--success))]" },
              { icon: Lock, label: "Privacy First", color: "text-primary" },
              { icon: BadgeCheck, label: "Verified Business", color: "text-[hsl(var(--warning))]" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Helper Components  
const PaymentDetailRow = ({ 
  label, value, onCopy, copied, mono = false 
}: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) => (
  <div className="flex items-center justify-between gap-3 p-3 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] group hover:border-[hsl(var(--primary)/0.3)] transition-colors">
    <div className="min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className={`font-medium truncate mt-0.5 ${mono ? 'font-mono text-sm' : ''}`}>
        {value}
      </p>
    </div>
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
      onClick={onCopy}
    >
      {copied ? (
        <Check className="w-4 h-4 text-[hsl(var(--success))]" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  </div>
);

const StepItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--secondary))] text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
      {number}
    </div>
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default FounderAccessPage;
