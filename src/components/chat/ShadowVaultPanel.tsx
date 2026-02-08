import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, X, Lock, Unlock, Plus, Trash2, Eye, EyeOff,
  CheckCircle2, XCircle, RefreshCw, Settings, Link, Unlink,
  Mail, Calendar, FileText, MessageSquare, CreditCard, Users, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useShadowVault, AVAILABLE_SERVICES, ServiceType } from "@/hooks/useShadowVault";
import { cn } from "@/lib/utils";

interface ShadowVaultPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getServiceIcon = (type: ServiceType) => {
  switch (type) {
    case 'email': return <Mail className="h-5 w-5" />;
    case 'calendar': return <Calendar className="h-5 w-5" />;
    case 'storage': return <FileText className="h-5 w-5" />;
    case 'messaging': return <MessageSquare className="h-5 w-5" />;
    case 'payment': return <CreditCard className="h-5 w-5" />;
    case 'crm': return <Users className="h-5 w-5" />;
    case 'social': return <Share2 className="h-5 w-5" />;
    default: return <Settings className="h-5 w-5" />;
  }
};

export const ShadowVaultPanel = ({ isOpen, onClose }: ShadowVaultPanelProps) => {
  const {
    connections,
    isLoading,
    isUnlocked,
    unlockVault,
    lockVault,
    addConnection,
    removeConnection,
    toggleConnection,
    availableServices,
  } = useShadowVault();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [addServiceDialog, setAddServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof AVAILABLE_SERVICES[0] | null>(null);
  const [apiKey, setApiKey] = useState("");

  const handleUnlock = () => {
    if (password.length >= 8) {
      unlockVault(password);
      setPassword("");
    }
  };

  const handleAddService = async () => {
    if (!selectedService || !apiKey) return;

    await addConnection(selectedService.name, selectedService.type, {
      apiKey: apiKey,
    });

    setAddServiceDialog(false);
    setSelectedService(null);
    setApiKey("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                Shadow Vault
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                  Sovereign
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground">
                Secure tool integration • Your data never leaves your control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <Button variant="outline" size="sm" onClick={lockVault} className="gap-2">
                <Lock className="h-4 w-4" />
                Lock Vault
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {!isUnlocked ? (
            // Lock Screen
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full text-center"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mx-auto mb-8 flex items-center justify-center">
                  <Lock className="h-12 w-12 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Unlock Your Vault</h3>
                <p className="text-muted-foreground mb-6">
                  Enter your master password to access your connected services
                </p>

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Master password"
                      className="h-12 pr-12"
                      onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <Button
                    onClick={handleUnlock}
                    disabled={password.length < 8}
                    className="w-full h-12 gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    <Unlock className="h-5 w-5" />
                    Unlock Vault
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Your credentials are encrypted client-side and never sent to any server
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            // Vault Content
            <div className="flex-1 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connected Services */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Connected Services</h3>
                    <Button size="sm" onClick={() => setAddServiceDialog(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {connections.length === 0 ? (
                        <Card className="border-dashed">
                          <CardContent className="p-6 text-center">
                            <Link className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-sm text-muted-foreground">
                              No services connected yet
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4"
                              onClick={() => setAddServiceDialog(true)}
                            >
                              Connect Your First Service
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        connections.map((connection) => (
                          <Card key={connection.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    connection.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}>
                                    {getServiceIcon(connection.service_type)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{connection.service_name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {connection.is_connected ? (
                                        <span className="flex items-center gap-1 text-green-500">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Connected
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-red-500">
                                          <XCircle className="h-3 w-3" />
                                          Disconnected
                                        </span>
                                      )}
                                      {connection.last_used_at && (
                                        <span>• Last used {new Date(connection.last_used_at).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={connection.is_active}
                                    onCheckedChange={(checked) => toggleConnection(connection.id, checked)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeConnection(connection.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Available Services */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Available Integrations</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="grid grid-cols-2 gap-3">
                      {availableServices.map((service) => {
                        const isConnected = connections.some(c => c.service_name === service.name);
                        const isComingSoon = service.description.includes('coming soon');
                        
                        return (
                          <Card 
                            key={service.name}
                            className={cn(
                              "cursor-pointer transition-all",
                              isConnected && "border-green-500/30 bg-green-500/5",
                              isComingSoon && "opacity-50 cursor-not-allowed",
                              !isConnected && !isComingSoon && "hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (!isComingSoon && !isConnected) {
                                setSelectedService(service);
                                setAddServiceDialog(true);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl">{service.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                    {service.name}
                                    {isConnected && (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {service.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* Privacy Notice */}
              <Card className="mt-6 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Shield className="h-8 w-8 text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">Sovereign Privacy Guarantee</h4>
                      <p className="text-sm text-muted-foreground">
                        Your credentials are encrypted client-side with AES-256-GCM before storage. 
                        S.E.E. executes tools locally or through secure Sovereign Nodes—OpenAI and Google 
                        never see your private business data. Your tools, your data, your control.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Add Service Dialog */}
        <Dialog open={addServiceDialog} onOpenChange={setAddServiceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedService && <span className="text-2xl">{selectedService.icon}</span>}
                Connect {selectedService?.name || 'Service'}
              </DialogTitle>
              <DialogDescription>
                Enter your API credentials to connect this service to Shadow Vault
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <p className="text-xs text-muted-foreground">
                  Your key is encrypted locally before storage
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAddServiceDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddService}
                disabled={!apiKey || isLoading}
                className="gap-2"
              >
                <Link className="h-4 w-4" />
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
};
