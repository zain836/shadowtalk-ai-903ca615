import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Shield, Building2, Crown, Globe } from 'lucide-react';

const OFFLINE_TIERS = [
  {
    id: 'personal',
    name: 'Personal',
    price: 'Free',
    icon: Shield,
    color: 'text-muted-foreground',
    border: 'border-border',
    features: [
      { name: '360M parameter model', included: true },
      { name: 'Basic chat & math', included: true },
      { name: 'Code templates', included: true },
      { name: 'Local storage (50MB)', included: true },
      { name: 'Advanced models (3B+)', included: false },
      { name: 'Stealth Vault encryption', included: false },
      { name: 'Knowledge Graph', included: false },
      { name: 'Team sync', included: false },
      { name: 'Custom models', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$29/mo',
    icon: Building2,
    color: 'text-primary',
    border: 'border-primary/50',
    popular: true,
    features: [
      { name: '3B parameter models', included: true },
      { name: 'Unlimited local AI chat', included: true },
      { name: 'Deep research (offline)', included: true },
      { name: 'Strategy reports', included: true },
      { name: 'Stealth Vault (AES-256)', included: true },
      { name: 'Knowledge Graph', included: true },
      { name: 'Local storage (5GB)', included: true },
      { name: 'Team sync', included: false },
      { name: 'Custom models', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99/mo',
    icon: Crown,
    color: 'text-amber-400',
    border: 'border-amber-400/50',
    features: [
      { name: '7B parameter models', included: true },
      { name: 'All Professional features', included: true },
      { name: 'Team sync & collaboration', included: true },
      { name: 'Compliance & audit logs', included: true },
      { name: 'Priority model downloads', included: true },
      { name: 'Local storage (50GB)', included: true },
      { name: 'SSO & workspace mgmt', included: true },
      { name: 'Custom model training', included: false },
      { name: 'Air-gapped deployment', included: false },
    ],
  },
  {
    id: 'sovereign',
    name: 'Sovereign',
    price: '$499/mo',
    icon: Globe,
    color: 'text-emerald-400',
    border: 'border-emerald-400/50',
    features: [
      { name: '13B+ parameter models', included: true },
      { name: 'All Enterprise features', included: true },
      { name: 'Air-gapped deployment', included: true },
      { name: 'Custom model fine-tuning', included: true },
      { name: 'Unlimited local storage', included: true },
      { name: 'Multi-device knowledge sync', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'On-premise installation', included: true },
      { name: 'White-label branding', included: true },
    ],
  },
];

const EnterpriseLicensePanel = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Offline Intelligence Tiers</h2>
        <p className="text-muted-foreground mt-2">Choose the offline AI power that matches your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {OFFLINE_TIERS.map(tier => {
          const Icon = tier.icon;
          return (
            <Card key={tier.id} className={`relative bg-card ${tier.border} hover:shadow-lg transition-shadow`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <Icon className={`h-8 w-8 mx-auto ${tier.color}`} />
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tier.features.map(feature => (
                  <div key={feature.name} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50'}>{feature.name}</span>
                  </div>
                ))}
                <Button
                  className="w-full mt-4"
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => window.location.href = '/founder-access'}
                >
                  {tier.price === 'Free' ? 'Current Plan' : 'Get Started'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison Note */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              All offline tiers include zero-latency inference, complete data sovereignty, and work without any internet connection.
            </p>
            <p className="text-xs text-muted-foreground">
              Enterprise & Sovereign tiers include compliance certifications (SOC 2, HIPAA-ready, GDPR).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseLicensePanel;
