import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type MFAFactor = {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
};

export const TwoFactorSetup = () => {
  const { toast } = useToast();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [copied, setCopied] = useState(false);

  const isEnabled = factors.some(f => f.status === "verified");

  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.totp || []);
    } catch (err: any) {
      console.error("Error loading MFA factors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setShowEnrollDialog(true);
    } catch (err: any) {
      toast({
        title: "Enrollment failed",
        description: err.message || "Could not start 2FA enrollment",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast({ title: "Invalid code", description: "Enter a 6-digit code", variant: "destructive" });
      return;
    }
    setIsVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast({ title: "2FA Enabled!", description: "Two-factor authentication is now active on your account." });
      setShowEnrollDialog(false);
      setVerifyCode("");
      await loadFactors();
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    const verifiedFactor = factors.find(f => f.status === "verified");
    if (!verifiedFactor) return;

    setIsUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
      if (error) throw error;

      toast({ title: "2FA Disabled", description: "Two-factor authentication has been removed." });
      setShowDisableDialog(false);
      await loadFactors();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not disable 2FA",
        variant: "destructive",
      });
    } finally {
      setIsUnenrolling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-muted/60 to-muted/30 border border-border/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isEnabled ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
              {isEnabled ? <ShieldCheck className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-success/20 text-success border-success/30" : ""}>
                  {isEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isEnabled
                  ? "Your account is protected with TOTP-based 2FA"
                  : "Add an extra layer of security using an authenticator app"}
              </p>
            </div>
          </div>
          {isEnabled ? (
            <Button variant="destructive" size="sm" onClick={() => setShowDisableDialog(true)}>
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={handleEnroll} disabled={isEnrolling} className="btn-glow">
              {isEnrolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Smartphone className="h-4 w-4 mr-2" />}
              Enable 2FA
            </Button>
          )}
        </div>

        {!isEnabled && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
            <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              We strongly recommend enabling 2FA. It protects your account even if your password is compromised.
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
          </div>
        )}
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-md glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit verification code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {/* Manual Secret */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Can't scan? Enter this key manually:</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-xs bg-muted/50 tracking-wider"
                />
                <Button variant="outline" size="icon" onClick={copySecret} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Verification */}
            <div className="space-y-2">
              <Label>Enter 6-digit verification code</Label>
              <Input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-muted/30"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEnrollDialog(false)}>Cancel</Button>
            <Button onClick={handleVerify} disabled={isVerifying || verifyCode.length !== 6} className="btn-glow">
              {isVerifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-sm glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Disable 2FA?
            </DialogTitle>
            <DialogDescription>
              This will remove the extra security layer from your account. You can re-enable it at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowDisableDialog(false)}>Keep Enabled</Button>
            <Button variant="destructive" onClick={handleUnenroll} disabled={isUnenrolling}>
              {isUnenrolling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Disable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
