import { ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import EnterpriseLicensePanel from '@/components/monetization/EnterpriseLicensePanel';

const EnterpriseLicensePage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Crown className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Enterprise Offline License</h1>
            <p className="text-sm text-muted-foreground">Premium offline AI tiers for individuals, teams, and enterprises</p>
          </div>
        </div>
        <EnterpriseLicensePanel />
      </div>
    </div>
  );
};

export default EnterpriseLicensePage;
