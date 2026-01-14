import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import Navigation from "@/components/Navigation";

const SubscriptionPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <SubscriptionManager />
      </div>
    </div>
  );
};

export default SubscriptionPage;
