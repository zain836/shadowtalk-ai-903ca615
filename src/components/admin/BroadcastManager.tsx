import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Mail, Bell, Radio, AlertTriangle, Info, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const broadcastTypes = [
  { value: 'update', label: 'Update', icon: Info, description: 'General update' },
  { value: 'feature', label: 'New Feature', icon: Zap, description: 'Feature announcement' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, description: 'Important warning' },
  { value: 'critical', label: 'Critical', icon: AlertTriangle, description: 'Critical alert' },
];

export const BroadcastManager: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('update');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendNotification, setSendNotification] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    emailsSent: number;
    notificationsCreated: number;
    totalUsers: number;
  } | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    if (!sendEmail && !sendNotification) {
      toast.error('Select at least one delivery method');
      return;
    }

    if (!confirm(`Send this broadcast to ALL users?\n\nSubject: ${subject}\nEmail: ${sendEmail ? 'Yes' : 'No'}\nNotification: ${sendNotification ? 'Yes' : 'No'}`)) {
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Broadcast to All Users
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
            disabled={sending || (!subject.trim() || !message.trim())}
            className="w-full gap-2"
            size="lg"
          >
            {sending ? (
              <>
                <Radio className="h-4 w-4 animate-pulse" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Broadcast
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
