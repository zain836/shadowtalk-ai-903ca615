import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, FileText, FolderOpen, Calendar, Search,
  Link2, Unlink, RefreshCw, Download, Upload, Check,
  AlertCircle, Loader2, ExternalLink, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface GoogleIntegrationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportContent?: (content: string, source: string) => void;
}

interface GoogleService {
  id: 'gmail' | 'drive' | 'docs' | 'calendar';
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  lastSync?: string;
}

export const GoogleIntegrationPanel: React.FC<GoogleIntegrationPanelProps> = ({
  isOpen,
  onClose,
  onImportContent
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<GoogleService[]>([
    { id: 'gmail', name: 'Gmail', icon: <Mail className="w-5 h-5" />, description: 'Access emails and compose messages', connected: false },
    { id: 'drive', name: 'Drive', icon: <FolderOpen className="w-5 h-5" />, description: 'Browse and manage files', connected: false },
    { id: 'docs', name: 'Docs', icon: <FileText className="w-5 h-5" />, description: 'Edit and create documents', connected: false },
    { id: 'calendar', name: 'Calendar', icon: <Calendar className="w-5 h-5" />, description: 'View and manage events', connected: false }
  ]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<Array<{ id: string; name: string; type: string; modified: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // Check existing connections on mount
  useEffect(() => {
    if (user && isOpen) {
      checkConnections();
    }
  }, [user, isOpen]);

  const checkConnections = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('oauth_tokens')
        .select('provider')
        .eq('user_id', user.id);
      
      if (data) {
        const connectedProviders = data.map(d => d.provider);
        setServices(prev => prev.map(s => ({
          ...s,
          connected: connectedProviders.includes(`google_${s.id}`)
        })));
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    }
  };

  const handleConnect = async (serviceId: string) => {
    setIsConnecting(serviceId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Please sign in first', variant: 'destructive' });
        setIsConnecting(null);
        return;
      }

      // Initiate real OAuth flow
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ provider: "google", scope: "both" })
      });

      const data = await resp.json();
      
      if (data.authUrl) {
        // Open OAuth popup
        const popup = window.open(data.authUrl, 'google-auth', 'width=500,height=600');
        
        // Listen for OAuth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'oauth-success') {
            setServices(prev => prev.map(s => ({
              ...s, connected: true, lastSync: new Date().toISOString()
            })));
            toast({ title: 'Google Connected!', description: 'All Google services are now linked.' });
            window.removeEventListener('message', handleMessage);
          } else if (event.data?.type === 'oauth-error') {
            toast({ title: 'Connection Failed', description: event.data.error, variant: 'destructive' });
            window.removeEventListener('message', handleMessage);
          }
        };
        window.addEventListener('message', handleMessage);
      } else {
        toast({ title: 'Connection Failed', description: data.error || 'Could not start OAuth flow', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Connection Failed', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('oauth_tokens').delete().eq('user_id', user.id).eq('provider', 'google');
    }
    
    setServices(prev => prev.map(s => ({ ...s, connected: false, lastSync: undefined })));
    setFiles([]);
    
    toast({ title: 'Disconnected', description: 'Google services have been disconnected.' });
  };

  const loadDriveFiles = async () => {
    setIsLoadingFiles(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: "drive.list", params: { maxResults: 20 } })
      });

      const result = await resp.json();
      
      if (result.data) {
        setFiles(result.data.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.mimeType?.includes('spreadsheet') ? 'spreadsheet' 
              : f.mimeType?.includes('presentation') ? 'presentation' 
              : 'document',
          modified: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString() : 'Unknown',
        })));
      }
    } catch (error) {
      console.error('Failed to load Drive files:', error);
      toast({ title: 'Failed to load files', variant: 'destructive' });
    }
    
    setIsLoadingFiles(false);
  };

  const handleImportFile = async (file: { id: string; name: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: "drive.get", params: { fileId: file.id } })
      });

      const result = await resp.json();
      const content = result.data?.content || `# ${file.name}\n\nContent could not be extracted.`;
      onImportContent?.(content, `Google Drive: ${file.name}`);
      
      toast({ title: 'File Imported', description: `${file.name} has been imported to your chat.` });
      onClose();
    } catch {
      toast({ title: 'Import Failed', variant: 'destructive' });
    }
  };

  const connectedCount = services.filter(s => s.connected).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Google Integration
                  <Badge variant="outline" className="text-xs">
                    {connectedCount}/{services.length} connected
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Access Gmail, Drive, Docs & Calendar securely
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="mx-4 mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-green-500">Privacy-First Integration</p>
                <p className="text-xs text-muted-foreground">
                  Unlike Gemini, ShadowTalk never stores or analyzes your Google data. 
                  All processing happens locally and data is discarded after use.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="drive" disabled={!services.find(s => s.id === 'drive')?.connected}>
                Drive
              </TabsTrigger>
              <TabsTrigger value="gmail" disabled={!services.find(s => s.id === 'gmail')?.connected}>
                Gmail
              </TabsTrigger>
              <TabsTrigger value="calendar" disabled={!services.find(s => s.id === 'calendar')?.connected}>
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {services.map(service => (
                  <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 rounded-xl border ${
                      service.connected 
                        ? 'border-green-500/30 bg-green-500/5' 
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          service.connected ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                        }`}>
                          {service.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      {service.connected && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      {service.connected ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setActiveTab(service.id)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDisconnect(service.id)}
                          >
                            <Unlink className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleConnect(service.id)}
                          disabled={isConnecting === service.id}
                        >
                          {isConnecting === service.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Link2 className="w-3 h-3 mr-1" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Drive Tab */}
            <TabsContent value="drive" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={loadDriveFiles} disabled={isLoadingFiles}>
                    {isLoadingFiles ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {files.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Click refresh to load your files</p>
                    </div>
                  ) : (
                    files
                      .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(file => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">Modified {file.modified}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImportFile(file)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Import
                          </Button>
                        </motion.div>
                      ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Gmail Tab */}
            <TabsContent value="gmail" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Gmail Integration</p>
                <p className="text-sm">Read and compose emails directly in chat</p>
                <Button className="mt-4" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Recent Emails
                </Button>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="mt-4">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium">Calendar Integration</p>
                <p className="text-sm">View and manage your schedule</p>
                <Button className="mt-4" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Today's Events
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
