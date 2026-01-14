import { ApiKeysManager } from "@/components/developer/ApiKeysManager";
import Navigation from "@/components/Navigation";

const ApiKeysPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <ApiKeysManager />
      </div>
    </div>
  );
};

export default ApiKeysPage;
