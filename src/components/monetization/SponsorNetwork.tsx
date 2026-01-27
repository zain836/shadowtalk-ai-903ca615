import { useState } from "react";
import { 
  Megaphone, ExternalLink, TrendingUp, BarChart3, 
  DollarSign, Users, Target, Sparkles, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSponsorPartners, SponsorPartner } from "@/hooks/useSponsorPartners";

interface SponsorRecommendationProps {
  context: string;
  category?: string;
  onDismiss?: () => void;
}

export function SponsorRecommendation({ context, category, onDismiss }: SponsorRecommendationProps) {
  const { generateSponsoredRecommendation, trackClick } = useSponsorPartners();
  const [dismissed, setDismissed] = useState(false);

  const recommendation = generateSponsoredRecommendation(context, category);

  if (!recommendation || dismissed) return null;

  const { partner } = recommendation;

  const handleClick = async () => {
    await trackClick(partner.id);
    window.open(partner.affiliateUrl || partner.websiteUrl || '#', '_blank');
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4 my-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                Expert Recommendation
              </Badge>
            </div>
            <p className="font-medium">{partner.name}</p>
            {partner.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {partner.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" onClick={handleClick} className="gap-2">
            <ExternalLink className="h-3 w-3" />
            Learn More
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline sponsor mention for AI "thinking trace" injection
export function InlineSponsorMention({ partner, onClick }: { partner: SponsorPartner; onClick: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 transition-colors mx-1"
      onClick={onClick}
    >
      <Star className="h-3 w-3" />
      <span className="text-sm font-medium">{partner.name}</span>
      <ExternalLink className="h-3 w-3" />
    </span>
  );
}

// Admin dashboard for managing sponsor partners
export function SponsorDashboard() {
  const { partners, isLoading } = useSponsorPartners();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Sponsor Partners
          </h2>
          <p className="text-muted-foreground">
            Manage contextual recommendations and affiliate partners
          </p>
        </div>
        <Button className="gap-2">
          <Target className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Partners</p>
                <p className="text-2xl font-bold">{partners.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">
                  {partners.length > 0
                    ? (partners.reduce((s, p) => s + p.commissionRate, 0) / partners.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(partners.map(p => p.category)).size}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Keywords</p>
                <p className="text-2xl font-bold">
                  {partners.reduce((s, p) => s + p.keywords.length, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner List */}
      <div className="space-y-4">
        {partners.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No partners yet</p>
              <p className="text-sm text-muted-foreground">
                Add sponsor partners to enable contextual recommendations
              </p>
            </CardContent>
          </Card>
        ) : (
          partners.map(partner => (
            <Card key={partner.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          className="h-8 w-8 object-contain"
                        />
                      ) : (
                        <Target className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{partner.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {partner.keywords.length} keywords
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">
                        {partner.commissionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Commission</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
