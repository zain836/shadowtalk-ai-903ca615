import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import DataInsightsPanel from '@/components/monetization/DataInsightsPanel';

const DataInsightsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Insights Collection</h1>
            <p className="text-sm text-muted-foreground">Anonymized analytics queue with offline behavior reports</p>
          </div>
        </div>
        <DataInsightsPanel />
      </div>
    </div>
  );
};

export default DataInsightsPage;
