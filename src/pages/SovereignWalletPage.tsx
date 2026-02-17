import { ArrowLeft, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SovereignWalletPanel from '@/components/monetization/SovereignWalletPanel';

const SovereignWalletPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sovereign Wallet</h1>
            <p className="text-sm text-muted-foreground">Offline credit system — use AI for free, pay only to sync</p>
          </div>
        </div>
        <SovereignWalletPanel />
      </div>
    </div>
  );
};

export default SovereignWalletPage;
