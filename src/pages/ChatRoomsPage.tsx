import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Users, Lock, Globe, Trash2, Link2, Copy, Check } from "lucide-react";
interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: string;
  max_participants: number;
  created_at: string;
}

const ChatRoomsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "", isPublic: true });
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  // Handle invite link
  useEffect(() => {
    const inviteId = searchParams.get('invite');
    if (inviteId && user) {
      navigate(`/rooms/${inviteId}`);
    }
  }, [searchParams, user, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadRooms();
  }, [user]);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setRooms(data as ChatRoom[]);
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim() || !user) return;

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({
        name: newRoom.name,
        description: newRoom.description || null,
        is_public: newRoom.isPublic,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
      return;
    }

    setRooms(prev => [data as ChatRoom, ...prev]);
    setNewRoom({ name: "", description: "", isPublic: true });
    setIsCreating(false);
    toast({ title: "Room created", description: "Your chat room is ready!" });
    navigate(`/rooms/${data.id}`);
  };

  const deleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', roomId);

    if (!error) {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    toast({ title: "Room deleted" });
    }
  };

  const copyInviteLink = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}/rooms?invite=${roomId}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedRoomId(roomId);
    toast({ title: "Link copied!", description: "Share this link to invite others" });
    setTimeout(() => setCopiedRoomId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chatbot')} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Collaborative Rooms</h1>
              <p className="text-muted-foreground text-sm">Chat with AI together in real-time</p>
            </div>
          </div>

          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="btn-glow rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input
                    value={newRoom.name}
                    onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="My Awesome Room"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newRoom.description}
                    onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What's this room about?"
                    className="rounded-xl"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Room</Label>
                    <p className="text-xs text-muted-foreground">Anyone can join public rooms</p>
                  </div>
                  <Switch
                    checked={newRoom.isPublic}
                    onCheckedChange={checked => setNewRoom({ ...newRoom, isPublic: checked })}
                  />
                </div>
                <Button onClick={createRoom} className="w-full btn-glow rounded-xl">
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No rooms yet</h2>
            <p className="text-muted-foreground mb-4">Create your first collaborative room to start chatting with others</p>
            <Button onClick={() => setIsCreating(true)} className="btn-glow rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Room
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map(room => (
              <Card key={room.id} className="card-hover cursor-pointer group" onClick={() => navigate(`/rooms/${room.id}`)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {room.is_public ? (
                        <Globe className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={e => copyInviteLink(room.id, e)}
                        title="Copy invite link"
                      >
                        {copiedRoomId === room.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Link2 className="h-4 w-4" />
                        )}
                      </Button>
                      {room.created_by === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={e => { e.stopPropagation(); deleteRoom(room.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>{room.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(room.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoomsPage;
