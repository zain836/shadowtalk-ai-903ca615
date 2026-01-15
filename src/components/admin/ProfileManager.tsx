import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { User, Search, Edit, Crown, Zap, Mail, Bell, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_email: boolean | null;
  notification_push: boolean | null;
  notification_mentions: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  user_id: string;
  email: string;
  subscribed: boolean | null;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch subscription info
      const { data: subsData } = await supabase
        .from('subscribers')
        .select('*');

      const subsMap = new Map<string, Subscription>();
      subsData?.forEach(s => {
        if (s.user_id) subsMap.set(s.user_id, s);
      });
      setSubscriptions(subsMap);

      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditForm({
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name || null,
          bio: editForm.bio || null,
          avatar_url: editForm.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProfile.id);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(p =>
          p.id === selectedProfile.id
            ? {
                ...p,
                display_name: editForm.display_name || null,
                bio: editForm.bio || null,
                avatar_url: editForm.avatar_url || null,
              }
            : p
        )
      );

      toast.success('Profile updated successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getSubscriptionBadge = (userId: string) => {
    const sub = subscriptions.get(userId);
    if (!sub || !sub.subscribed) {
      return <Badge variant="outline">Free</Badge>;
    }

    switch (sub.subscription_tier) {
      case 'elite':
      case 'enterprise':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Crown className="h-3 w-3 mr-1" />
            {sub.subscription_tier === 'enterprise' ? 'Enterprise' : 'Elite'}
          </Badge>
        );
      case 'premium':
        return (
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        );
      case 'pro':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      default:
        return <Badge variant="secondary">{sub.subscription_tier}</Badge>;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredProfiles = profiles.filter(profile => {
    const displayName = profile.display_name?.toLowerCase() || '';
    const bio = profile.bio?.toLowerCase() || '';
    const sub = subscriptions.get(profile.id);
    const email = sub?.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return displayName.includes(search) || bio.includes(search) || email.includes(search);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          User Profiles ({profiles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or bio..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Profiles Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? 'No matching profiles found' : 'No profiles yet'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Notifications</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => {
                const sub = subscriptions.get(profile.id);
                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(profile.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {profile.display_name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sub?.email || profile.id.slice(0, 8) + '...'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getSubscriptionBadge(profile.id)}
                        {sub?.subscription_end && (
                          <p className="text-xs text-muted-foreground">
                            Until {format(new Date(sub.subscription_end), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {profile.notification_email && (
                          <Mail className="h-4 w-4 text-muted-foreground" aria-label="Email notifications" />
                        )}
                        {profile.notification_push && (
                          <Bell className="h-4 w-4 text-muted-foreground" aria-label="Push notifications" />
                        )}
                        {profile.notification_mentions && (
                          <AtSign className="h-4 w-4 text-muted-foreground" aria-label="Mention notifications" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProfile(profile)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update the user's profile information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Enter display name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar URL</label>
                <Input
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="User bio..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
