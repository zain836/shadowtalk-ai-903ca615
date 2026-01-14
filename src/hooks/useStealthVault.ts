import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  encryptEntry,
  decryptEntry,
  EncryptedEntry,
  DecryptedEntry,
} from '@/lib/e2e-encryption';

export interface VaultEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedVaultEntry {
  id: string;
  title_encrypted: string;
  content_encrypted: string;
  iv: string;
  salt: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export const useStealthVault = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Unlock vault with password
  const unlockVault = useCallback(async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      // Fetch encrypted entries
      const { data, error } = await supabase
        .from('stealth_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const entriesData = (data || []) as EncryptedVaultEntry[];
      
      // If there are entries, try to decrypt the first one to verify password
      if (entriesData.length > 0) {
        const firstEntry = entriesData[0];
        try {
          await decryptEntry({
            titleEncrypted: firstEntry.title_encrypted,
            contentEncrypted: firstEntry.content_encrypted,
            iv: firstEntry.iv,
            salt: firstEntry.salt,
          }, password);
        } catch {
          toast({
            title: "Incorrect password",
            description: "The vault password is incorrect",
            variant: "destructive"
          });
          setIsLoading(false);
          return false;
        }

        // Decrypt all entries
        const decryptedEntries: VaultEntry[] = [];
        for (const entry of entriesData) {
          try {
            const decrypted = await decryptEntry({
              titleEncrypted: entry.title_encrypted,
              contentEncrypted: entry.content_encrypted,
              iv: entry.iv,
              salt: entry.salt,
            }, password);
            
            decryptedEntries.push({
              id: entry.id,
              title: decrypted.title,
              content: decrypted.content,
              category: entry.category,
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
            });
          } catch {
            console.error('Failed to decrypt entry:', entry.id);
          }
        }
        setEntries(decryptedEntries);
      } else {
        // No entries yet - just unlock with the new password
        setEntries([]);
      }

      setVaultPassword(password);
      setIsUnlocked(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error unlocking vault:', error);
      toast({
        title: "Error",
        description: "Failed to unlock vault",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [user, toast]);

  // Lock vault
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setVaultPassword(null);
    setEntries([]);
  }, []);

  // Add new entry
  const addEntry = useCallback(async (
    title: string,
    content: string,
    category: string = 'general'
  ): Promise<boolean> => {
    if (!user || !vaultPassword) return false;
    
    setIsLoading(true);
    try {
      const encrypted = await encryptEntry(title, content, vaultPassword);

      const { data, error } = await supabase
        .from('stealth_vault')
        .insert({
          user_id: user.id,
          title_encrypted: encrypted.titleEncrypted,
          content_encrypted: encrypted.contentEncrypted,
          iv: encrypted.iv,
          salt: encrypted.salt,
          category,
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: VaultEntry = {
        id: data.id,
        title,
        content,
        category,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({ title: "Entry added", description: "Your encrypted entry has been saved" });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Error",
        description: "Failed to add entry",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [user, vaultPassword, toast]);

  // Update entry
  const updateEntry = useCallback(async (
    id: string,
    title: string,
    content: string,
    category?: string
  ): Promise<boolean> => {
    if (!user || !vaultPassword) return false;
    
    setIsLoading(true);
    try {
      const encrypted = await encryptEntry(title, content, vaultPassword);

      const updateData: Record<string, string> = {
        title_encrypted: encrypted.titleEncrypted,
        content_encrypted: encrypted.contentEncrypted,
        iv: encrypted.iv,
        salt: encrypted.salt,
      };
      
      if (category) {
        updateData.category = category;
      }

      const { error } = await supabase
        .from('stealth_vault')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.map(e => 
        e.id === id 
          ? { ...e, title, content, category: category || e.category, updatedAt: new Date().toISOString() }
          : e
      ));
      
      toast({ title: "Entry updated" });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [user, vaultPassword, toast]);

  // Delete entry
  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('stealth_vault')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
      toast({ title: "Entry deleted" });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [user, toast]);

  // Change vault password (re-encrypts all entries)
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!user || !vaultPassword) return false;
    
    // Verify current password matches
    if (currentPassword !== vaultPassword) {
      toast({
        title: "Incorrect password",
        description: "Current password is incorrect",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      // Re-encrypt all entries with new password
      for (const entry of entries) {
        const encrypted = await encryptEntry(entry.title, entry.content, newPassword);
        
        await supabase
          .from('stealth_vault')
          .update({
            title_encrypted: encrypted.titleEncrypted,
            content_encrypted: encrypted.contentEncrypted,
            iv: encrypted.iv,
            salt: encrypted.salt,
          })
          .eq('id', entry.id)
          .eq('user_id', user.id);
      }

      setVaultPassword(newPassword);
      toast({ title: "Password changed", description: "All entries have been re-encrypted" });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [user, vaultPassword, entries, toast]);

  return {
    isUnlocked,
    isLoading,
    entries,
    unlockVault,
    lockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    changePassword,
  };
};
