import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Eye, EyeOff, Trash2, Plus, Key, Loader2, 
  RefreshCw, Copy, Check, AlertTriangle, Folder, Search,
  Edit2, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStealthVault, VaultEntry } from '@/hooks/useStealthVault';
import { calculatePasswordStrength, generateStrongPassword } from '@/lib/e2e-encryption';

interface StealthVaultProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '📝' },
  { value: 'passwords', label: 'Passwords', icon: '🔑' },
  { value: 'notes', label: 'Private Notes', icon: '📒' },
  { value: 'financial', label: 'Financial', icon: '💳' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
];

export const StealthVault: React.FC<StealthVaultProps> = ({ isOpen, onClose }) => {
  const {
    isUnlocked,
    isLoading,
    entries,
    unlockVault,
    lockVault,
    addEntry,
    updateEntry,
    deleteEntry,
    changePassword,
  } = useStealthVault();

  const [vaultPassword, setVaultPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showContent, setShowContent] = useState<Record<string, boolean>>({});
  
  // New entry form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', category: 'general' });
  
  // Edit entry
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: '' });
  
  // Delete confirmation
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);
  
  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(vaultPassword));
  }, [vaultPassword]);

  const handleUnlock = async () => {
    if (vaultPassword.length < 8) {
      return;
    }
    await unlockVault(vaultPassword);
  };

  const handleLock = () => {
    lockVault();
    setVaultPassword('');
    setShowContent({});
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    
    const success = await addEntry(newEntry.title, newEntry.content, newEntry.category);
    if (success) {
      setNewEntry({ title: '', content: '', category: 'general' });
      setShowAddForm(false);
    }
  };

  const handleStartEdit = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setEditForm({ title: entry.title, content: entry.content, category: entry.category });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editForm.title.trim() || !editForm.content.trim()) return;
    
    const success = await updateEntry(editingEntry.id, editForm.title, editForm.content, editForm.category);
    if (success) {
      setEditingEntry(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    await deleteEntry(deletingEntry.id);
    setDeletingEntry(null);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword.length < 8) {
      return;
    }
    
    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const generatePassword = () => {
    const password = generateStrongPassword(20);
    setVaultPassword(password);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Stealth Vault
            <Badge variant="outline" className="ml-2 text-xs">E2E Encrypted</Badge>
          </DialogTitle>
          <DialogDescription>
            Your data is encrypted client-side before storage. Only you can access it with your password.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!isUnlocked ? (
            /* Unlock Screen */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-sm space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Unlock Your Vault</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your vault password to access encrypted entries
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Vault Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={vaultPassword}
                        onChange={(e) => setVaultPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        placeholder="Enter your vault password"
                        className="pr-20"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {vaultPassword && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Password Strength</span>
                        <span className={passwordStrength >= 70 ? 'text-green-500' : passwordStrength >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                          {getPasswordStrengthLabel(passwordStrength)}
                        </span>
                      </div>
                      <Progress value={passwordStrength} className={`h-1.5 ${getPasswordStrengthColor(passwordStrength)}`} />
                    </div>
                  )}

                  <Button 
                    onClick={handleUnlock} 
                    className="w-full btn-glow" 
                    disabled={isLoading || vaultPassword.length < 8}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Unlock Vault
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generatePassword}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Strong Password
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <strong className="text-amber-500">Important:</strong> Your password cannot be recovered if lost. 
                      All data is encrypted client-side using AES-256-GCM.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Unlocked Vault */
            <Tabs defaultValue="entries" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-1 mb-4">
                <TabsList>
                  <TabsTrigger value="entries">Entries</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" onClick={handleLock}>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Vault
                </Button>
              </div>

              <TabsContent value="entries" className="flex-1 overflow-hidden flex flex-col mt-0">
                {/* Search and Filter */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search entries..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <Folder className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Entries List */}
                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {filteredEntries.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          {entries.length === 0 ? "No entries yet. Add your first encrypted entry." : "No entries match your search."}
                        </p>
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                        <div key={entry.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {CATEGORIES.find(c => c.value === entry.category)?.icon || '📝'}
                              </span>
                              <div>
                                <h4 className="font-medium">{entry.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Updated {new Date(entry.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyToClipboard(entry.content, entry.id)}
                              >
                                {copiedId === entry.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setShowContent(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
                              >
                                {showContent[entry.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleStartEdit(entry)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletingEntry(entry)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {showContent[entry.id] && (
                            <div className="bg-background rounded p-3 font-mono text-sm whitespace-pre-wrap break-all">
                              {entry.content}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Change Vault Password
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Changing your password will re-encrypt all entries with the new password.
                    </p>
                    <Button variant="outline" onClick={() => setShowChangePassword(true)}>
                      Change Password
                    </Button>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security Information
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Encryption: AES-256-GCM</li>
                      <li>• Key Derivation: PBKDF2 with 100,000 iterations</li>
                      <li>• All encryption happens in your browser</li>
                      <li>• Server never sees your unencrypted data</li>
                      <li>• Unique salt and IV for each entry</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Vault Statistics</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{entries.length}</p>
                        <p className="text-xs text-muted-foreground">Entries</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {new Set(entries.map(e => e.category)).size}
                        </p>
                        <p className="text-xs text-muted-foreground">Categories</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">256-bit</p>
                        <p className="text-xs text-muted-foreground">Encryption</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Add Entry Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Entry</DialogTitle>
              <DialogDescription>
                Your entry will be encrypted before being stored.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newEntry.title}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Entry title..."
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newEntry.category} 
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Sensitive content to encrypt..."
                  rows={5}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddEntry} disabled={isLoading} className="flex-1 btn-glow">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  Encrypt & Save
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={editForm.category} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingEntry?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Vault Password</DialogTitle>
              <DialogDescription>
                All entries will be re-encrypted with your new password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {newPassword && (
                  <Progress 
                    value={calculatePasswordStrength(newPassword)} 
                    className="h-1.5" 
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8}
                  className="flex-1"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => setShowChangePassword(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
