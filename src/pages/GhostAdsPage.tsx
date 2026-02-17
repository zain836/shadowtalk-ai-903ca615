import { ArrowLeft, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import GhostAdsManagerPanel from '@/components/monetization/GhostAdsManagerPanel';

const GhostAdsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Ghost className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ghost Ads Manager</h1>
            <p className="text-sm text-muted-foreground">Contextual offline sponsor recommendations & impression tracking</p>
          </div>
        </div>
        <GhostAdsManagerPanel />
      </div>
    </div>
  );
};

export default GhostAdsPage;
