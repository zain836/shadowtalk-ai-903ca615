import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import ReferralProgram from "@/components/ReferralProgram";

const ReferralPage = () => {
  useEffect(() => {
    document.title = "Referral Program - ShadowTalk AI | Earn Up to 40% Commission";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <ReferralProgram />
      </div>
    </div>
  );
};

export default ReferralPage;
