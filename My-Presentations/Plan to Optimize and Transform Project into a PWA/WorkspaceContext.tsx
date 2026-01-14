import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { Workspace, WorkspaceMember, PlanTier } from '@/types/database';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, slug: string) => Promise<Workspace | null>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<boolean>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<boolean>;
  removeMember: (workspaceId: string, userId: string) => Promise<boolean>;
  updateMemberRole: (workspaceId: string, userId: string, role: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  currentPlan: PlanTier;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load workspaces for current user
  const loadWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get all workspaces where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, permissions')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setIsLoading(false);
        return;
      }

      const workspaceIds = memberData.map(m => m.workspace_id);

      // Get workspace details
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .in('id', workspaceIds)
        .order('created_at', { ascending: false });

      if (workspaceError) throw workspaceError;

      setWorkspaces(workspaceData || []);

      // Set current workspace (from localStorage or first workspace)
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId');
      const workspace = savedWorkspaceId
        ? workspaceData?.find(w => w.id === savedWorkspaceId)
        : workspaceData?.[0];

      if (workspace) {
        setCurrentWorkspace(workspace);
        localStorage.setItem('currentWorkspaceId', workspace.id);

        // Load members for current workspace
        const { data: membersData } = await supabase
          .from('workspace_members')
          .select('*')
          .eq('workspace_id', workspace.id);

        setWorkspaceMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  const switchWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);

      // Load members for new workspace
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      setWorkspaceMembers(membersData || []);
    }
  };

  const createWorkspace = async (name: string, slug: string): Promise<Workspace | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug,
          owner_id: user.id,
          plan_tier: 'free',
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('workspace_members')
        .insert({
          workspace_id: data.id,
          user_id: user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        });

      // Refresh workspaces
      await loadWorkspaces();

      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId);

      if (error) throw error;

      // Refresh workspaces
      await loadWorkspaces();

      return true;
    } catch (error) {
      console.error('Error updating workspace:', error);
      return false;
    }
  };

  const deleteWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      // Refresh workspaces
      await loadWorkspaces();

      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }
  };

  const inviteMember = async (workspaceId: string, email: string, role: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Generate invitation token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { error } = await supabase
        .from('workspace_invitations')
        .insert({
          workspace_id: workspaceId,
          email,
          role,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      // TODO: Send invitation email
      console.log('Invitation created for:', email);

      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      return false;
    }
  };

  const removeMember = async (workspaceId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      setWorkspaceMembers(membersData || []);

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  };

  const updateMemberRole = async (workspaceId: string, userId: string, role: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      const { data: membersData } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId);

      setWorkspaceMembers(membersData || []);

      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !currentWorkspace) return false;

    const member = workspaceMembers.find(m => m.user_id === user.id);
    if (!member) return false;

    // Owners and admins have all permissions
    if (member.role === 'owner' || member.role === 'admin') return true;

    // Check specific permissions
    const permissions = member.permissions as any;
    return permissions?.includes(permission) || false;
  };

  const getCurrentMember = (): WorkspaceMember | null => {
    if (!user || !currentWorkspace) return null;
    return workspaceMembers.find(m => m.user_id === user.id) || null;
  };

  const isOwner = getCurrentMember()?.role === 'owner';
  const isAdmin = getCurrentMember()?.role === 'admin' || isOwner;
  const currentPlan = currentWorkspace?.plan_tier || 'free';

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    workspaceMembers,
    isLoading,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    removeMember,
    updateMemberRole,
    hasPermission,
    isOwner,
    isAdmin,
    currentPlan,
    refreshWorkspaces,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
