import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { encryptData, decryptData } from '@/lib/e2e-encryption';

// =============================================================================
// SHADOW VAULT - Sovereign Tool Integration
// =============================================================================

export type ServiceType = 'email' | 'calendar' | 'storage' | 'messaging' | 'payment' | 'crm' | 'social' | 'custom';

export interface VaultConnection {
  id: string;
  user_id: string;
  service_name: string;
  service_type: ServiceType;
  is_connected: boolean;
  is_active: boolean;
  scopes: string[];
  permissions: Record<string, boolean>;
  last_used_at?: string;
  last_sync_at?: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

// Available services that can be connected
export const AVAILABLE_SERVICES = [
  { name: 'Gmail', type: 'email' as ServiceType, icon: '📧', description: 'Send and receive emails' },
  { name: 'Google Calendar', type: 'calendar' as ServiceType, icon: '📅', description: 'Manage calendar events' },
  { name: 'Google Drive', type: 'storage' as ServiceType, icon: '📁', description: 'Access and manage files' },
  { name: 'Google Sheets', type: 'storage' as ServiceType, icon: '📊', description: 'Read and write spreadsheets' },
  { name: 'WhatsApp', type: 'messaging' as ServiceType, icon: '💬', description: 'Send messages (coming soon)' },
  { name: 'LinkedIn', type: 'social' as ServiceType, icon: '💼', description: 'Professional networking (coming soon)' },
  { name: 'Stripe', type: 'payment' as ServiceType, icon: '💳', description: 'Payment processing' },
  { name: 'Notion', type: 'storage' as ServiceType, icon: '📝', description: 'Notes and databases' },
  { name: 'Slack', type: 'messaging' as ServiceType, icon: '🔔', description: 'Team messaging' },
  { name: 'HubSpot', type: 'crm' as ServiceType, icon: '🎯', description: 'CRM and marketing' },
];

export const useShadowVault = () => {
  const { toast } = useToast();
  const [connections, setConnections] = useState<VaultConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  // Fetch all connections
  const fetchConnections = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('shadow_vault_connections')
        .select('id, user_id, service_name, service_type, is_connected, is_active, scopes, permissions, last_used_at, last_sync_at, sync_status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedConnections = (data || []).map(c => ({
        ...c,
        permissions: (c.permissions as Record<string, boolean>) || {}
      })) as VaultConnection[];
      
      setConnections(typedConnections);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  }, []);

  // Unlock the vault with master password
  const unlockVault = useCallback((password: string) => {
    setMasterPassword(password);
    setIsUnlocked(true);
    toast({ title: "Vault Unlocked", description: "Your Shadow Vault is now accessible" });
  }, [toast]);

  // Lock the vault
  const lockVault = useCallback(() => {
    setMasterPassword(null);
    setIsUnlocked(false);
    toast({ title: "Vault Locked" });
  }, [toast]);

  // Add a new connection
  const addConnection = useCallback(async (
    serviceName: string,
    serviceType: ServiceType,
    credentials?: {
      accessToken?: string;
      refreshToken?: string;
      apiKey?: string;
    },
    scopes?: string[]
  ): Promise<VaultConnection | null> => {
    if (!isUnlocked || !masterPassword) {
      toast({ title: "Vault is locked", description: "Please unlock your vault first", variant: "destructive" });
      return null;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Sign in required", variant: "destructive" });
        return null;
      }

      // Encrypt credentials if provided
      let encryptedCredentials: { encrypted: string; iv: string; salt: string } | null = null;
      if (credentials?.apiKey || credentials?.accessToken) {
        const dataToEncrypt = JSON.stringify(credentials);
        encryptedCredentials = await encryptData(dataToEncrypt, masterPassword);
      }

      const { data, error } = await supabase
        .from('shadow_vault_connections')
        .upsert({
          user_id: user.id,
          service_name: serviceName,
          service_type: serviceType,
          is_connected: true,
          is_active: true,
          scopes: scopes || [],
          permissions: {},
          credentials_encrypted: encryptedCredentials?.encrypted,
          iv: encryptedCredentials?.iv,
          salt: encryptedCredentials?.salt,
          sync_status: 'idle'
        }, {
          onConflict: 'user_id,service_name'
        })
        .select('id, user_id, service_name, service_type, is_connected, is_active, scopes, permissions, last_used_at, last_sync_at, sync_status, created_at, updated_at')
        .single();

      if (error) throw error;

      const newConnection = {
        ...data,
        permissions: (data.permissions as Record<string, boolean>) || {}
      } as VaultConnection;
      
      setConnections(prev => {
        const filtered = prev.filter(c => c.service_name !== serviceName);
        return [newConnection, ...filtered];
      });
      
      toast({ title: "Connection added", description: `${serviceName} is now connected` });
      return newConnection;
    } catch (error) {
      console.error('Error adding connection:', error);
      toast({ title: "Failed to add connection", variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isUnlocked, masterPassword, toast]);

  // Get decrypted credentials for a connection
  const getCredentials = useCallback(async (connectionId: string): Promise<Record<string, string> | null> => {
    if (!isUnlocked || !masterPassword) {
      toast({ title: "Vault is locked", variant: "destructive" });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('shadow_vault_connections')
        .select('credentials_encrypted, iv, salt')
        .eq('id', connectionId)
        .single();

      if (error) throw error;

      if (!data.credentials_encrypted || !data.iv || !data.salt) {
        return null;
      }

      const decrypted = await decryptData(
        data.credentials_encrypted,
        data.iv,
        data.salt,
        masterPassword
      );

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error getting credentials:', error);
      toast({ title: "Failed to decrypt credentials", variant: "destructive" });
      return null;
    }
  }, [isUnlocked, masterPassword, toast]);

  // Remove a connection
  const removeConnection = useCallback(async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('shadow_vault_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({ title: "Connection removed" });
    } catch (error) {
      console.error('Error removing connection:', error);
      toast({ title: "Failed to remove connection", variant: "destructive" });
    }
  }, [toast]);

  // Toggle connection active state
  const toggleConnection = useCallback(async (connectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('shadow_vault_connections')
        .update({ is_active: isActive })
        .eq('id', connectionId);

      if (error) throw error;

      setConnections(prev => prev.map(c =>
        c.id === connectionId ? { ...c, is_active: isActive } : c
      ));
    } catch (error) {
      console.error('Error toggling connection:', error);
    }
  }, []);

  // Update last used timestamp
  const markAsUsed = useCallback(async (connectionId: string) => {
    try {
      await supabase
        .from('shadow_vault_connections')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', connectionId);
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    isLoading,
    isUnlocked,
    unlockVault,
    lockVault,
    fetchConnections,
    addConnection,
    getCredentials,
    removeConnection,
    toggleConnection,
    markAsUsed,
    availableServices: AVAILABLE_SERVICES,
  };
};
