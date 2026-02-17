import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Camera, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

interface ProfileTabProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  email: string;
  bio: string;
  setBio: (v: string) => void;
  avatarUrl: string;
  setAvatarUrl: (v: string) => void;
  createdAt?: string;
}

export const ProfileTab = ({
  displayName, setDisplayName, email, bio, setBio, avatarUrl, setAvatarUrl, createdAt
}: ProfileTabProps) => {
  return (
    <motion.div {...tabMotion} className="space-y-6">
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> Profile Information
          </CardTitle>
          <CardDescription>Your public-facing identity across the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                  {displayName?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full shadow-lg">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Avatar URL</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className="bg-muted/30 border-border/50" />
            </div>
          </div>

          <Separator className="bg-border/30" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" maxLength={50} className="bg-muted/30 border-border/50" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted/50 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bio</Label>
              <span className="text-xs text-muted-foreground">{bio.length}/500</span>
            </div>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others a bit about yourself..." rows={4} maxLength={500} className="bg-muted/30 border-border/50 resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Account Details Card */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" /> Account Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Member Since</p>
              <p className="text-sm font-semibold">{createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Account ID</p>
              <p className="text-sm font-mono font-semibold truncate">{email.split('@')[0]}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
              <p className="text-sm font-semibold text-emerald-400">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
