import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Users, Bot, Loader2, Link2, Check, Shield, FileEdit, MessageSquare, Pointer } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RoomModeration from "@/components/chat/RoomModeration";
import CollaborativeEditor from "@/components/collaboration/CollaborativeEditor";
import PresenceAvatars from "@/components/collaboration/PresenceAvatars";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { LiveCursors } from "@/components/collaboration/LiveCursors";
import { MentionInput } from "@/components/collaboration/MentionInput";
interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const CollaborativeRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [roomCreatorId, setRoomCreatorId] = useState<string | null>(null);
  const [showModeration, setShowModeration] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('chat');
  const [sharedDocument, setSharedDocument] = useState("");
  const [documentLoading, setDocumentLoading] = useState(false);
  const [showLiveCursors, setShowLiveCursors] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const documentUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Real-time presence
  const { onlineUsers: presenceUsers } = useRealtimePresence({ channelName: `room-presence-${roomId}` });
  
  // Convert participants to mention-compatible format
  const mentionUsers = participants.map(p => ({
    id: p.user_id,
    displayName: p.display_name || 'Anonymous',
  }));

  useEffect(() => {
    if (!user || !roomId) {
      navigate('/rooms');
      return;
    }
    
    loadRoomData();
    loadSharedDocument();
    joinRoom();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`room-messages-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as RoomMessage]);
      })
      .subscribe();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`room-participants-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      }, () => {
        loadParticipants();
      })
      .subscribe();

    // Subscribe to document changes for real-time sync
    const documentChannel = supabase
      .channel(`room-document-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_documents',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        // Only update if the change came from another user
        const newDoc = payload.new as { content: string; last_edited_by: string };
        if (newDoc && newDoc.last_edited_by !== user?.id) {
          setSharedDocument(newDoc.content);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(documentChannel);
      if (documentUpdateTimeout.current) {
        clearTimeout(documentUpdateTimeout.current);
      }
      leaveRoom();
    };
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadRoomData = async () => {
    if (!roomId) return;
    
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('name, created_by')
      .eq('id', roomId)
      .single();
    
    if (room) {
      setRoomName(room.name);
      setRoomCreatorId(room.created_by);
    }
    
    const { data: msgs } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (msgs) setMessages(msgs as RoomMessage[]);
    
    await loadParticipants();
  };

  const loadSharedDocument = async () => {
    if (!roomId) return;
    
    setDocumentLoading(true);
    const { data } = await supabase
      .from('room_documents')
      .select('content')
      .eq('room_id', roomId)
      .maybeSingle();
    
    if (data) {
      setSharedDocument(data.content);
    }
    setDocumentLoading(false);
  };

  const saveSharedDocument = async (content: string) => {
    if (!roomId || !user) return;
    
    // Debounce updates - only save after 500ms of no changes
    if (documentUpdateTimeout.current) {
      clearTimeout(documentUpdateTimeout.current);
    }
    
    documentUpdateTimeout.current = setTimeout(async () => {
      const { data: existing } = await supabase
        .from('room_documents')
        .select('id')
        .eq('room_id', roomId)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from('room_documents')
          .update({ 
            content, 
            last_edited_by: user.id 
          })
          .eq('room_id', roomId);
      } else {
        await supabase
          .from('room_documents')
          .insert({ 
            room_id: roomId, 
            content, 
            last_edited_by: user.id 
          });
      }
    }, 500);
  };

  const handleDocumentChange = (content: string) => {
    setSharedDocument(content);
    saveSharedDocument(content);
  };

  const loadParticipants = async () => {
    if (!roomId) return;
    
    const { data } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId);
    
    if (data) setParticipants(data as Participant[]);
  };

  const joinRoom = async () => {
    if (!user || !roomId) return;
    
    const displayName = user.email?.split('@')[0] || 'Anonymous';
    
    await supabase
      .from('room_participants')
      .upsert({
        room_id: roomId,
        user_id: user.id,
        display_name: displayName
      }, { onConflict: 'room_id,user_id' });
  };

  const leaveRoom = async () => {
    if (!user || !roomId) return;
    
    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);
  };

  const sendMessage = async () => {
    if (!message.trim() || !user || !roomId || isLoading) return;
    
    const displayName = user.email?.split('@')[0] || 'Anonymous';
    
    // Insert user message
    const { error } = await supabase
      .from('room_messages')
      .insert({
        room_id: roomId,
        user_id: user.id,
        display_name: displayName,
        content: message,
        role: 'user'
      });
    
    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      return;
    }
    
    const userMessage = message;
    setMessage("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const chatMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      chatMessages.push({ role: 'user', content: userMessage });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          messages: chatMessages,
          personality: 'friendly',
          mode: 'general'
        }),
      });

      if (!resp.ok) throw new Error("Failed to get AI response");

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
            if (content) assistantContent += content;
          } catch { break; }
        }
      }

      if (assistantContent) {
        await supabase
          .from('room_messages')
          .insert({
            room_id: roomId,
            user_id: user.id,
            display_name: 'ShadowTalk AI',
            content: assistantContent,
            role: 'assistant'
          });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to get AI response", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/rooms?invite=${roomId}`;
    await navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    toast({ title: "Invite link copied!", description: "Share this link to invite others to this room" });
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-emerald-500', 'bg-amber-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/rooms')} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold">{roomName || 'Chat Room'}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {participants.length} participant{participants.length !== 1 ? 's' : ''} • {presenceUsers.length} online
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'editor')}>
              <TabsList className="h-9">
                <TabsTrigger value="chat" className="gap-1.5 text-xs">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="editor" className="gap-1.5 text-xs">
                  <FileEdit className="h-3.5 w-3.5" />
                  Collaborate
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Moderation Button - Only for room creator */}
            {user && roomCreatorId === user.id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowModeration(true)} 
                      className="rounded-xl gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Moderate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage room participants</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={copyInviteLink} className="rounded-xl gap-2">
                    {linkCopied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Invite
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy invite link to share with others</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Live Cursors Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={showLiveCursors ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setShowLiveCursors(!showLiveCursors)} 
                    className="rounded-xl gap-2"
                  >
                    <Pointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showLiveCursors ? 'Hide' : 'Show'} live cursors</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Presence Avatars */}
            <PresenceAvatars users={presenceUsers} maxVisible={5} />
          </div>
        </div>
      </header>

      {/* Live Cursors Overlay */}
      {activeTab === 'chat' && (
        <LiveCursors 
          channelName={`room-cursors-${roomId}`}
          containerRef={chatContainerRef}
          enabled={showLiveCursors}
        />
      )}

      {/* Content Area */}
      {activeTab === 'chat' ? (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div ref={chatContainerRef} className="max-w-3xl mx-auto space-y-4 relative">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start the conversation! Everyone in this room will see your messages.</p>
                </div>
              )}
              
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'assistant' ? '' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-gradient-to-br from-primary to-secondary' : getAvatarColor(msg.display_name || 'A')}>
                      {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : (msg.display_name || 'A')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.display_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input with @mentions */}
          <div className="border-t border-border p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <MentionInput
                value={message}
                onChange={setMessage}
                onSubmit={sendMessage}
                users={mentionUsers}
                placeholder="Type a message... Use @ to mention"
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !message.trim()} className="rounded-xl btn-glow">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* Collaborative Editor */
        <div className="flex-1 p-4">
          <div className="max-w-5xl mx-auto h-full">
            {documentLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <CollaborativeEditor
                documentId={roomId || 'default'}
                initialContent={sharedDocument}
                onContentChange={handleDocumentChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Moderation Panel */}
      {user && roomId && roomCreatorId && (
        <RoomModeration
          isOpen={showModeration}
          onClose={() => setShowModeration(false)}
          roomId={roomId}
          roomCreatorId={roomCreatorId}
          currentUserId={user.id}
          participants={participants}
          onParticipantRemoved={loadParticipants}
        />
      )}
    </div>
  );
};

export default CollaborativeRoom;
