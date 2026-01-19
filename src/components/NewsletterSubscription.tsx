import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

const NewsletterSubscription = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingSubscriber } = await supabase
        .from("subscribers")
        .select("id, subscribed")
        .eq("email", email)
        .maybeSingle();

      if (existingSubscriber) {
        if (existingSubscriber.subscribed) {
          toast.info("You're already subscribed to our newsletter!");
        } else {
          // Re-subscribe
          await supabase
            .from("subscribers")
            .update({ subscribed: true, updated_at: new Date().toISOString() })
            .eq("id", existingSubscriber.id);
          toast.success("Welcome back! You've been re-subscribed.");
          setIsSubscribed(true);
        }
      } else {
        // Create new subscriber
        const { error } = await supabase
          .from("subscribers")
          .insert({ email, subscribed: true });

        if (error) throw error;
        
        toast.success("Thanks for subscribing! 🎉");
        setIsSubscribed(true);
      }
      
      setEmail("");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-card p-8 rounded-2xl mb-12">
      <div className="text-center md:text-left md:flex md:items-center md:justify-between">
        <div className="mb-6 md:mb-0">
          <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
          <p className="text-muted-foreground">
            Get the latest updates, features, and AI insights delivered to your inbox.
          </p>
        </div>
        
        {isSubscribed ? (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Thanks for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 min-w-[300px]">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-background border-border focus-visible:ring-primary"
              disabled={isLoading}
              required
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-3 btn-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsletterSubscription;
