import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Eye, EyeOff, Trash2, Plus, Key, Loader2, 
  RefreshCw, Copy, Check, AlertTriangle, Folder, Search,
  Edit2, Save, X, Fingerprint, ShieldCheck, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStealthVault, VaultEntry } from '@/hooks/useStealthVault';
import { calculatePasswordStrength, generateStrongPassword } from '@/lib/e2e-encryption';
import { motion, AnimatePresence } from 'framer-motion';

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
    isUnlocked, isLoading, entries, unlockVault, lockVault,
    addEntry, updateEntry, deleteEntry, changePassword,
  } = useStealthVault();

  const [vaultPassword, setVaultPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showContent, setShowContent] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', category: 'general' });
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: '' });
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unlockAttempted, setUnlockAttempted] = useState(false);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(vaultPassword));
  }, [vaultPassword]);

  const handleUnlock = async () => {
    if (vaultPassword.length < 8) return;
    setUnlockAttempted(true);
    const success = await unlockVault(vaultPassword);
    if (!success) {
      setTimeout(() => setUnlockAttempted(false), 600);
    }
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
    if (success) setEditingEntry(null);
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    await deleteEntry(deletingEntry.id);
    setDeletingEntry(null);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword || newPassword.length < 8) return;
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

  const getStrengthColor = (s: number) => s < 40 ? 'text-red-500' : s < 70 ? 'text-amber-500' : 'text-emerald-500';
  const getStrengthLabel = (s: number) => s < 40 ? 'Weak' : s < 70 ? 'Medium' : 'Strong';
  const getStrengthBarColor = (s: number) => s < 40 ? 'bg-red-500' : s < 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            Stealth Vault
            <Badge variant="outline" className="ml-2 text-xs font-mono">AES-256-GCM</Badge>
          </DialogTitle>
          <DialogDescription>
            Zero-knowledge encryption. Your data never leaves your browser unencrypted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {!isUnlocked ? (
              /* ═══ PREMIUM UNLOCK SCREEN ═══ */
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex items-center justify-center p-8"
              >
                <div className="w-full max-w-sm space-y-6">
                  {/* Animated Lock */}
                  <div className="text-center">
                    <motion.div
                      animate={unlockAttempted && !isUnlocked ? { 
                        x: [-10, 10, -8, 8, -4, 4, 0],
                      } : {}}
                      transition={{ duration: 0.5 }}
                      className="relative mx-auto w-20 h-20"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{ rotateY: isLoading ? 360 : 0 }}
                          transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                        >
                          <Fingerprint className="h-10 w-10 text-primary" />
                        </motion.div>
                      </div>
                      {/* Pulse ring */}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-2xl border-2 border-primary/30"
                      />
                    </motion.div>
                    <h3 className="text-lg font-semibold mt-4">Unlock Your Vault</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your master password to decrypt entries
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Master Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={vaultPassword}
                          onChange={(e) => setVaultPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                          placeholder="••••••••••••"
                          className="pr-20 h-12 rounded-xl bg-muted/50 border-border/50 focus:border-primary/50 font-mono text-lg tracking-widest"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                            onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Strength indicator */}
                    {vaultPassword && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Strength</span>
                          <span className={getStrengthColor(passwordStrength)}>{getStrengthLabel(passwordStrength)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength}%` }}
                            className={`h-full rounded-full ${getStrengthBarColor(passwordStrength)}`}
                          />
                        </div>
                      </motion.div>
                    )}

                    <Button onClick={handleUnlock} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold" 
                      disabled={isLoading || vaultPassword.length < 8}>
                      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Decrypt & Open
                    </Button>

                    <Button variant="ghost" size="sm" onClick={generatePassword} className="w-full text-xs text-muted-foreground hover:text-foreground">
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Generate Strong Password
                    </Button>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-amber-500">Zero-recovery:</strong> Password cannot be reset. All encryption is client-side with PBKDF2 + AES-256-GCM.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ═══ UNLOCKED VAULT ═══ */
              <motion.div key="unlocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
                <Tabs defaultValue="entries" className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-1 mb-4">
                    <TabsList className="bg-muted/50">
                      <TabsTrigger value="entries" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Entries</TabsTrigger>
                      <TabsTrigger value="settings" className="gap-1.5"><Key className="h-3.5 w-3.5" />Settings</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {entries.length} encrypted
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleLock} className="rounded-lg gap-1.5">
                        <Lock className="h-3.5 w-3.5" />Lock
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="entries" className="flex-1 overflow-hidden flex flex-col mt-0">
                    {/* Search and Filter */}
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search entries..." className="pl-9 rounded-xl bg-muted/30" />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-40 rounded-xl"><Folder className="h-4 w-4 mr-2" /><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setShowAddForm(true)} className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-primary/80">
                        <Plus className="h-4 w-4" />Add
                      </Button>
                    </div>

                    {/* Entries List */}
                    <ScrollArea className="flex-1">
                      <div className="space-y-2 pr-4">
                        {filteredEntries.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                              <Shield className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {entries.length === 0 ? "Add your first encrypted entry" : "No entries match your search"}
                            </p>
                          </div>
                        ) : (
                          <AnimatePresence>
                            {filteredEntries.map((entry, i) => (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: i * 0.03 }}
                                className="group rounded-xl p-4 border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
                              >
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center gap-3">
                                    <div className="text-xl w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                                      {CATEGORIES.find(c => c.value === entry.category)?.icon || '📝'}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm">{entry.title}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => copyToClipboard(entry.content, entry.id)}>
                                      {copiedId === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowContent(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}>
                                      {showContent[entry.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => handleStartEdit(entry)}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeletingEntry(entry)}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <AnimatePresence>
                                  {showContent[entry.id] && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="mt-3 bg-muted/30 rounded-lg p-3 font-mono text-sm whitespace-pre-wrap break-all border border-border/30">
                                        {entry.content}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
                        <h4 className="font-semibold mb-1 flex items-center gap-2"><Key className="h-4 w-4 text-primary" />Change Vault Password</h4>
                        <p className="text-sm text-muted-foreground mb-4">Re-encrypts all entries with the new password.</p>
                        <Button variant="outline" onClick={() => setShowChangePassword(true)} className="rounded-lg">Change Password</Button>
                      </div>
                      <div className="rounded-xl border border-border/50 bg-card/50 p-5">
                        <h4 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Security Details</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Encryption', value: 'AES-256-GCM' },
                            { label: 'Key Derivation', value: 'PBKDF2 (100K)' },
                            { label: 'Entries', value: String(entries.length) },
                            { label: 'Categories', value: String(new Set(entries.map(e => e.category)).size) },
                          ].map(item => (
                            <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                              <p className="font-mono text-sm font-semibold text-primary">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Entry Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />New Encrypted Entry</DialogTitle>
              <DialogDescription>Content is encrypted before leaving your browser.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input value={newEntry.title} onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))} placeholder="Entry title..." className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={newEntry.category} onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Content</Label>
                <Textarea value={newEntry.content} onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))} placeholder="Sensitive content to encrypt..." rows={5} className="rounded-xl font-mono" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddEntry} disabled={isLoading} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  Encrypt & Save
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="bg-background/95 backdrop-blur-xl">
            <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Content</Label>
                <Textarea value={editForm.content} onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))} rows={5} className="rounded-xl font-mono" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} disabled={isLoading} className="flex-1 rounded-xl">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingEntry(null)} className="rounded-xl">Cancel</Button>
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
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogContent className="bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle>Change Vault Password</DialogTitle>
              <DialogDescription>All entries will be re-encrypted with your new password.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" />
                {newPassword && <Progress value={calculatePasswordStrength(newPassword)} className="h-1.5" />}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="rounded-xl" />
                {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-destructive">Passwords do not match</p>}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 8} className="flex-1 rounded-xl">
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => setShowChangePassword(false)} className="rounded-xl">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
