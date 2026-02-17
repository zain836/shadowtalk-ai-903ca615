import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Phone, CheckCircle2, Loader2, Send,
  Unlink, RefreshCw, Shield, ExternalLink, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppLink {
  id: string;
  phone_number: string;
  is_verified: boolean;
  is_active: boolean;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
}

type Step = "idle" | "phone" | "code" | "linked";

export const WhatsAppConnect = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [copied, setCopied] = useState(false);

  const WHATSAPP_BOT_NUMBER = "+14155238886"; // Twilio sandbox default

  const fetchLink = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("whatsapp_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (data) {
      setLink(data as WhatsAppLink);
      setStep(data.is_verified ? "linked" : "code");
      if (!data.is_verified) setPhoneNumber(data.phone_number);
    }
  }, []);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const callWebhook = async (action: string, extraParams: Record<string, string> = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action, userId: user.id, ...extraParams }),
      }
    );

    return response.json();
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const result = await callWebhook("link", { phoneNumber: formatted });

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setStep("code");
        toast({ title: "Code sent!", description: "Check your WhatsApp for the verification code" });
      }
    } catch {
      toast({ title: "Failed to send code", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const result = await callWebhook("verify", { phoneNumber: formatted, code: verificationCode });

      if (result.error) {
        toast({ title: "Verification failed", description: result.error, variant: "destructive" });
      } else {
        setStep("linked");
        await fetchLink();
        toast({ title: "WhatsApp linked!", description: "You can now chat with ShadowTalk via WhatsApp" });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      await callWebhook("unlink", { phoneNumber: link?.phone_number || "" });
      setLink(null);
      setStep("idle");
      setPhoneNumber("");
      setVerificationCode("");
      toast({ title: "WhatsApp unlinked" });
    } catch {
      toast({ title: "Failed to unlink", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(WHATSAPP_BOT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_BOT_NUMBER.replace("+", "")}?text=Hi%20ShadowTalk`, "_blank");
  };

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold flex items-center gap-2">
              WhatsApp
              {step === "linked" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                  Connected
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">Chat with ShadowTalk AI via WhatsApp</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Link your WhatsApp to use ShadowTalk as a contact. Chat, use /commands, and get AI responses directly in WhatsApp.
              </p>
              
              <div className="flex gap-2">
                <Button onClick={() => setStep("phone")} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                  <Phone className="h-4 w-4" />
                  Link Phone Number
                </Button>
                <Button variant="outline" onClick={openWhatsApp} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Chat
                </Button>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground flex-1">
                  Bot number: <span className="font-mono font-medium text-foreground">{WHATSAPP_BOT_NUMBER}</span>
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyNumber}>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Enter your WhatsApp phone number with country code (e.g., +1234567890)
              </p>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("idle")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSendCode}
                  disabled={isLoading || phoneNumber.length < 10}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Code
                </Button>
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to your WhatsApp ({phoneNumber})
              </p>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="font-mono text-center text-lg tracking-[0.5em]"
                maxLength={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("phone")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verify
                </Button>
              </div>
              <Button
                variant="link"
                size="sm"
                className="w-full text-xs"
                onClick={handleSendCode}
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Resend code
              </Button>
            </motion.div>
          )}

          {step === "linked" && link && (
            <motion.div
              key="linked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-400">Linked to {link.phone_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.message_count} messages • {link.last_message_at ? `Last: ${new Date(link.last_message_at).toLocaleDateString()}` : "No messages yet"}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1"><Shield className="h-3 w-3" /> Commands: /help, /search, /calendar, /email, /status</p>
                <p>Or just type naturally to chat with AI</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={openWhatsApp} className="flex-1 gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={isLoading}
                  className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Unlink className="h-4 w-4" />
                  Unlink
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
