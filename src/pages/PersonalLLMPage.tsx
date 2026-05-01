import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { OfflineDisabledNotice } from "@/components/chat/OfflineDisabledNotice";

/**
 * The original Personal LLM page (Hybrid local-first + Supabase sync) is paused
 * while a new offline mode is being built. The full implementation is preserved
 * in version control and can be restored once the new engine lands.
 */
const PersonalLLMPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <OfflineDisabledNotice
          title="Personal LLM is being rebuilt"
          description="Your private on-device assistant is paused while we ship a new, more reliable offline engine. Your saved memory remains stored locally — it will be re-attached when the new version goes live."
        />
      </div>
      <Footer />
    </div>
  );
};

export default PersonalLLMPage;
