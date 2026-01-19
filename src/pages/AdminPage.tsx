import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Shield,
  ArrowLeft,
  Trash2,
  Crown,
  Zap,
  MessageSquareHeart,
  Star,
  Bug,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  Clock,
  XCircle,
  Key,
  Megaphone,
  User,
  Activity,
  Server,
  Radio,
  Globe,
  Route,
  Bell,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FeedbackAnalytics } from '@/components/FeedbackAnalytics';
import { GeminiKeysManager } from '@/components/admin/GeminiKeysManager';
import { UserRoleManager } from '@/components/admin/UserRoleManager';
import { ProfileManager } from '@/components/admin/ProfileManager';
import { AnnouncementManager } from '@/components/admin/AnnouncementManager';
import { RealTimeUserFlow } from '@/components/admin/RealTimeUserFlow';
import { WebHealthMonitor } from '@/components/admin/WebHealthMonitor';
import { RealTimeFeedback } from '@/components/admin/RealTimeFeedback';
import { GeographicTracker } from '@/components/admin/GeographicTracker';
import { UserJourneyTracker } from '@/components/admin/UserJourneyTracker';
import { AdminAlerts } from '@/components/admin/AdminAlerts';
import { AnalyticsExport } from '@/components/admin/AnalyticsExport';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface ConversationData {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface SubscriberData {
  id: string;
  email: string;
  user_id: string | null;
  subscribed: boolean | null;
  subscription_tier: string | null;
  subscription_end: string | null;
  created_at: string;
}

interface FeedbackData {
  id: string;
  user_id: string | null;
  email: string | null;
  category: string;
  rating: number | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'bug':
      return <Bug className="h-4 w-4 text-destructive" />;
    case 'feature':
      return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    case 'improvement':
      return <Zap className="h-4 w-4 text-blue-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'resolved':
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    case 'dismissed':
      return <Badge className="bg-muted text-muted-foreground border-border"><XCircle className="h-3 w-3 mr-1" />Dismissed</Badge>;
    default:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  }
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeSubscribers: 0,
    proSubscribers: 0,
    eliteSubscribers: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/chatbot');
    }
  }, [adminLoading, isAdmin, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;
      setConversations(convData || []);

      // Fetch messages count per conversation
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id');

      if (msgError) throw msgError;

      // Count messages per conversation
      const msgCounts: Record<string, number> = {};
      msgData?.forEach(msg => {
        msgCounts[msg.conversation_id] = (msgCounts[msg.conversation_id] || 0) + 1;
      });

      // Update conversations with message counts
      setConversations(prev => prev.map(conv => ({
        ...conv,
        message_count: msgCounts[conv.id] || 0
      })));

      // Fetch subscribers
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;
      setSubscribers(subData || []);

      // Fetch feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);

      // Calculate stats
      const uniqueUserIds = new Set(convData?.map(c => c.user_id) || []);
      setStats({
        totalUsers: uniqueUserIds.size,
        totalConversations: convData?.length || 0,
        totalMessages: msgData?.length || 0,
        activeSubscribers: subData?.filter(s => s.subscribed).length || 0,
        proSubscribers: subData?.filter(s => s.subscription_tier === 'pro').length || 0,
        eliteSubscribers: subData?.filter(s => s.subscription_tier === 'elite').length || 0,
        totalFeedback: feedbackData?.length || 0,
        pendingFeedback: feedbackData?.filter(f => f.status === 'pending').length || 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation and all its messages?')) return;

    try {
      // Delete messages first
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (msgError) throw msgError;

      // Delete conversation
      const { error: convError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (convError) throw convError;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status: newStatus } : f
      ));
      toast.success(`Feedback marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating feedback:', error);
      toast.error('Failed to update feedback status');
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedback(prev => prev.filter(f => f.id !== feedbackId));
      toast.success('Feedback deleted');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chatbot')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            {user?.email}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? <Skeleton className="h-8 w-16" /> : (
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscribers</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? <Skeleton className="h-8 w-16" /> : (
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {stats.proSubscribers} Pro
                    </Badge>
                    <Badge className="text-xs bg-gradient-primary">
                      <Crown className="h-3 w-3 mr-1" />
                      {stats.eliteSubscribers} Elite
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="realtime" className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="realtime" className="gap-2">
                <Radio className="h-4 w-4" />
                Live Users
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-2">
                <Server className="h-4 w-4" />
                Web Health
              </TabsTrigger>
              <TabsTrigger value="live-feedback" className="gap-2">
                <Activity className="h-4 w-4" />
                Live Feedback
              </TabsTrigger>
              <TabsTrigger value="geo-tracking" className="gap-2">
                <Globe className="h-4 w-4" />
                User Map
              </TabsTrigger>
              <TabsTrigger value="journeys" className="gap-2">
                <Route className="h-4 w-4" />
                Journeys
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <Bell className="h-4 w-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-2">
                <MessageSquareHeart className="h-4 w-4" />
                Feedback
                {stats.pendingFeedback > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {stats.pendingFeedback}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscribers" className="gap-2">
                <Crown className="h-4 w-4" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="conversations" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="gemini-keys" className="gap-2">
                <Key className="h-4 w-4" />
                Gemini Keys
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="profiles" className="gap-2">
                <User className="h-4 w-4" />
                Profiles
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Announcements
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="realtime">
            <RealTimeUserFlow />
          </TabsContent>

          <TabsContent value="health">
            <WebHealthMonitor />
          </TabsContent>

          <TabsContent value="live-feedback">
            <RealTimeFeedback />
          </TabsContent>

          <TabsContent value="geo-tracking">
            <GeographicTracker />
          </TabsContent>

          <TabsContent value="journeys">
            <UserJourneyTracker />
          </TabsContent>

          <TabsContent value="alerts">
            <AdminAlerts />
          </TabsContent>

          <TabsContent value="export">
            <AnalyticsExport />
          </TabsContent>

          <TabsContent value="feedback">
            {/* Analytics Charts */}
            {!loadingData && feedback.length > 0 && (
              <FeedbackAnalytics feedback={feedback} />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareHeart className="h-5 w-5 text-primary" />
                  User Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : feedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No feedback yet</p>
                ) : (
                  <div className="space-y-4">
                    {feedback.map(item => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(item.category)}
                            <div>
                              <p className="font-medium capitalize">{item.category.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.email || 'Anonymous'} • {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < item.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                ))}
                              </div>
                            )}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-foreground/90 pl-7">{item.message}</p>
                        
                        <div className="flex items-center gap-2 pl-7 pt-2">
                          <Select
                            value={item.status}
                            onValueChange={(value) => handleUpdateFeedbackStatus(item.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteFeedback(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : subscribers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No subscribers yet</p>
                ) : (
                  <div className="space-y-2">
                    {subscribers.map(sub => (
                      <div 
                        key={sub.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{sub.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.subscribed ? (
                            <>
                              <Badge className={sub.subscription_tier === 'elite' ? 'bg-gradient-primary' : ''}>
                                {sub.subscription_tier === 'elite' ? (
                                  <><Crown className="h-3 w-3 mr-1" /> Elite</>
                                ) : (
                                  <><Zap className="h-3 w-3 mr-1" /> Pro</>
                                )}
                              </Badge>
                              {sub.subscription_end && (
                                <span className="text-xs text-muted-foreground">
                                  Until {new Date(sub.subscription_end).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline">Free</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {conversations.map(conv => (
                      <div 
                        key={conv.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{conv.title || 'Untitled Conversation'}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{conv.message_count || 0} messages</span>
                            <span>Updated: {new Date(conv.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteConversation(conv.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gemini-keys">
            <GeminiKeysManager />
          </TabsContent>

          <TabsContent value="roles">
            <UserRoleManager />
          </TabsContent>

          <TabsContent value="profiles">
            <ProfileManager />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
