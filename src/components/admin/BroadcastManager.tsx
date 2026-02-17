import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Mail, Bell, Radio, AlertTriangle, Info, Zap, Users, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const broadcastTypes = [
  { value: 'update', label: 'Update', icon: Info, description: 'General update' },
  { value: 'feature', label: 'New Feature', icon: Zap, description: 'Feature announcement' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, description: 'Important warning' },
  { value: 'critical', label: 'Critical', icon: AlertTriangle, description: 'Critical alert' },
];

interface Subscriber {
  id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: string | null;
  created_at: string;
}

export const BroadcastManager: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('update');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sending, setSending] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [lastResult, setLastResult] = useState<{
    emailsSent: number;
    notificationsCreated: number;
    totalUsers: number;
  } | null>(null);

  const fetchSubscribers = async () => {
    setLoadingSubs(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
      // Auto-select all subscribed users
      const subscribedIds = new Set((data || []).filter(s => s.subscribed).map(s => s.id));
      setSelectedIds(subscribedIds);
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
      toast.error('Failed to load subscribers');
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === subscribers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(subscribers.map(s => s.id)));
    }
  };

  const selectedEmails = subscribers.filter(s => selectedIds.has(s.id)).map(s => s.email);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    if (!sendEmail && !sendNotification) {
      toast.error('Select at least one delivery method');
      return;
    }

    if (selectedEmails.length === 0) {
      toast.error('Select at least one recipient');
      return;
    }

    if (!confirm(`Send this broadcast to ${selectedEmails.length} recipients?\n\nSubject: ${subject}\nEmail: ${sendEmail ? 'Yes' : 'No'}\nNotification: ${sendNotification ? 'Yes' : 'No'}`)) {
      return;
    }

    setSending(true);
    try {
      const response = await supabase.functions.invoke('send-broadcast', {
        body: { subject, message, type, sendEmail, sendNotification },
      });

      if (response.error) throw response.error;

      const result = response.data;
      setLastResult(result);

      toast.success(
        `Broadcast sent! ${result.emailsSent} emails, ${result.notificationsCreated} notifications`
      );

      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const activeCount = subscribers.filter(s => s.subscribed).length;
  const inactiveCount = subscribers.filter(s => !s.subscribed).length;

  return (
    <div className="space-y-6">
      {/* Subscriber List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recipients
            <Badge variant="secondary" className="ml-1">{subscribers.length} total</Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{activeCount} active</Badge>
            {inactiveCount > 0 && (
              <Badge variant="destructive" className="opacity-70">{inactiveCount} unsubscribed</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchSubscribers} disabled={loadingSubs}>
            <RefreshCw className={`h-4 w-4 ${loadingSubs ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loadingSubs ? (
            <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No subscribers found</div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
                <Checkbox
                  checked={selectedIds.size === subscribers.length}
                  onCheckedChange={toggleAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} of {subscribers.length} selected
                </span>
              </div>
              <ScrollArea className="h-[240px]">
                <div className="space-y-1">
                  {subscribers.map((sub) => (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                        selectedIds.has(sub.id) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedIds.has(sub.id)}
                          onCheckedChange={() => toggleSelect(sub.id)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{sub.email}</span>
                            {sub.subscribed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sub.subscription_tier && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                                {sub.subscription_tier}
                              </Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              Joined {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {/* Compose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Compose Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New Feature: Voice Mode 2.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {broadcastTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your broadcast message here..."
              rows={5}
            />
          </div>

          <div className="flex items-center gap-6 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Send Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">In-App Notification</span>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim() || selectedEmails.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {sending ? (
              <>
                <Radio className="h-4 w-4 animate-pulse" />
                Broadcasting to {selectedEmails.length} recipients...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedEmails.length} Recipients
              </>
            )}
          </Button>

          {lastResult && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-sm font-medium mb-2">Last Broadcast Result</p>
              <div className="flex gap-3">
                <Badge variant="secondary">
                  <Mail className="h-3 w-3 mr-1" />
                  {lastResult.emailsSent} emails sent
                </Badge>
                <Badge variant="secondary">
                  <Bell className="h-3 w-3 mr-1" />
                  {lastResult.notificationsCreated} notifications
                </Badge>
                <Badge variant="outline">
                  {lastResult.totalUsers} total users
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
