import { useState } from "react";
import { Coins, Plus, History, Sparkles, ExternalLink, Zap, Gift, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useShadowCredits, SESSION_COSTS, CREDIT_PACKAGES } from "@/hooks/useShadowCredits";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export function ShadowWallet() {
  const navigate = useNavigate();
  const { balance, transactions, isLoading } = useShadowCredits();
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Coins className="h-4 w-4 animate-pulse" />
        <span className="text-xs">...</span>
      </Button>
    );
  }

  const credits = balance?.balance || 0;
  const isLow = credits <= 3;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${isLow ? 'text-amber-500' : 'text-primary'}`}
          >
            <Coins className={`h-4 w-4 ${isLow ? 'animate-pulse' : ''}`} />
            <span className="font-mono font-bold">{credits}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Credits</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            {/* Balance Display */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shadow Credits</p>
                <p className="text-3xl font-bold gradient-text">{credits}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </div>

            {/* Low Balance Warning */}
            {isLow && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-500">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Low Balance</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Top up to continue using premium features
                </p>
              </div>
            )}

            {/* Session Costs */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Session Costs</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Chat</span>
                  <Badge variant="secondary">{SESSION_COSTS.chatSession}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Research</span>
                  <Badge variant="secondary">{SESSION_COSTS.deepResearch}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Code</span>
                  <Badge variant="secondary">{SESSION_COSTS.codeGeneration}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Strategy</span>
                  <Badge variant="secondary">{SESSION_COSTS.strategyReport}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={() => navigate('/founder-access')}
              >
                <Plus className="h-4 w-4" />
                Buy Credits
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Transaction History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Coins className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {tx.transactionType === 'purchase' ? (
                        <Plus className="h-4 w-4 text-green-500" />
                      ) : tx.transactionType === 'bonus' ? (
                        <Gift className="h-4 w-4 text-purple-500" />
                      ) : tx.transactionType === 'referral' ? (
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {tx.transactionType.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.description || tx.sessionType || 'Credit transaction'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${
                      tx.amount > 0 ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Credit purchase cards for checkout
export function CreditPackageCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {CREDIT_PACKAGES.map((pkg, index) => (
        <Card
          key={pkg.id}
          className={`relative overflow-hidden transition-all hover:scale-105 cursor-pointer ${
            index === 1 ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => navigate('/founder-access')}
        >
          {index === 1 && (
            <Badge className="absolute top-2 right-2 bg-primary">
              Best Value
            </Badge>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{pkg.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-3xl font-bold">${pkg.price}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-medium">{pkg.credits} Credits</span>
                </div>
                {pkg.bonus > 0 && (
                  <div className="flex items-center gap-2 text-green-500">
                    <Gift className="h-4 w-4" />
                    <span className="text-sm">+{pkg.bonus} Bonus</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  ${pkg.pricePerCredit.toFixed(2)} per credit
                </p>
              </div>
              <Button className="w-full gap-2" variant={index === 1 ? "default" : "outline"}>
                <ExternalLink className="h-4 w-4" />
                Get Credits
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
