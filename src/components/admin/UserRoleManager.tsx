import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, UserPlus, Trash2, Search, Crown, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  user_email?: string;
}

interface Profile {
  id: string;
  display_name: string | null;
}

export const UserRoleManager: React.FC = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoleEmail, setNewRoleEmail] = useState('');
  const [newRoleType, setNewRoleType] = useState<'admin' | 'moderator'>('moderator');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles for display names
      const userIds = rolesData?.map(r => r.user_id) || [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profileMap = new Map<string, Profile>();
        profilesData?.forEach(p => profileMap.set(p.id, p));
        setProfiles(profileMap);
      }

      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load user roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!newRoleEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setAssigningRole(true);
    try {
      // First, we need to find the user by email using a different approach
      // Since we can't directly query auth.users, we'll search profiles or subscribers
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('user_id, email')
        .eq('email', newRoleEmail.toLowerCase())
        .single();

      if (!subscribers?.user_id) {
        toast.error('User not found. Make sure the user has signed up.');
        return;
      }

      const userId = subscribers.user_id;

      // Check if role already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', newRoleType)
        .single();

      if (existing) {
        toast.error(`User already has ${newRoleType} role`);
        return;
      }

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRoleType,
        });

      if (error) throw error;

      toast.success(`${newRoleType} role assigned to ${newRoleEmail}`);
      setIsDialogOpen(false);
      setNewRoleEmail('');
      fetchRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveRole = async (roleId: string, role: string, userId: string) => {
    if (!confirm(`Are you sure you want to remove this ${role} role?`)) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(prev => prev.filter(r => r.id !== roleId));
      toast.success('Role removed successfully');
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Crown className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'moderator':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">
            <Shield className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const filteredRoles = roles.filter(role => {
    const profile = profiles.get(role.user_id);
    const displayName = profile?.display_name?.toLowerCase() || '';
    const userId = role.user_id.toLowerCase();
    const search = searchTerm.toLowerCase();
    return displayName.includes(search) || userId.includes(search) || role.role.includes(search);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            User Role Management
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Role to User</DialogTitle>
                <DialogDescription>
                  Enter the user's email address and select the role to assign.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={newRoleEmail}
                    onChange={(e) => setNewRoleEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newRoleType} onValueChange={(v) => setNewRoleType(v as 'admin' | 'moderator')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignRole} disabled={assigningRole}>
                  {assigningRole ? 'Assigning...' : 'Assign Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or user ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Roles Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {searchTerm ? 'No matching roles found' : 'No roles assigned yet'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => {
                const profile = profiles.get(role.user_id);
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {profile?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {role.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(role.role)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(role.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveRole(role.id, role.role, role.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
