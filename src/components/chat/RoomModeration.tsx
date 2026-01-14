import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { 
  Shield, 
  UserX, 
  Ban, 
  Trash2, 
  Users,
  MessageSquareX,
  Crown
} from "lucide-react";

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
}

interface RoomModerationProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomCreatorId: string;
  currentUserId: string;
  participants: Participant[];
  onParticipantRemoved: () => void;
}

const RoomModeration = ({
  isOpen,
  onClose,
  roomId,
  roomCreatorId,
  currentUserId,
  participants,
  onParticipantRemoved
}: RoomModerationProps) => {
  const { toast } = useToast();
  const [banReason, setBanReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [actionType, setActionType] = useState<'kick' | 'ban' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCreator = currentUserId === roomCreatorId;

  const handleKick = async (participant: Participant) => {
    setIsProcessing(true);
    
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', participant.user_id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to remove participant", variant: "destructive" });
    } else {
      toast({ title: "User removed", description: `${participant.display_name} has been removed from the room` });
      onParticipantRemoved();
    }
    
    setIsProcessing(false);
    setActionType(null);
    setSelectedUser(null);
  };

  const handleBan = async (participant: Participant) => {
    setIsProcessing(true);
    
    // First kick the user
    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', participant.user_id);
    
    // Then add to ban list
    const { error } = await supabase
      .from('room_bans')
      .insert({
        room_id: roomId,
        user_id: participant.user_id,
        banned_by: currentUserId,
        reason: banReason || null
      });
    
    if (error) {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    } else {
      toast({ 
        title: "User banned", 
        description: `${participant.display_name} has been banned from this room` 
      });
      onParticipantRemoved();
    }
    
    setIsProcessing(false);
    setActionType(null);
    setSelectedUser(null);
    setBanReason("");
  };

  const handleClearMessages = async (userId: string, displayName: string) => {
    const { error } = await supabase
      .from('room_messages')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to clear messages", variant: "destructive" });
    } else {
      toast({ title: "Messages cleared", description: `All messages from ${displayName} have been removed` });
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-emerald-500', 'bg-amber-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (!isCreator) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Room Moderation
            </DialogTitle>
            <DialogDescription>
              Manage participants and maintain room order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Participants List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">
                  Participants ({participants.length})
                </Label>
              </div>
              
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {participants.map(participant => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs ${getAvatarColor(participant.display_name || 'A')}`}>
                            {(participant.display_name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {participant.display_name || 'Anonymous'}
                            </span>
                            {participant.user_id === roomCreatorId && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(participant.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {participant.user_id !== roomCreatorId && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleClearMessages(participant.user_id, participant.display_name)}
                            title="Clear messages"
                          >
                            <MessageSquareX className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedUser(participant);
                              setActionType('kick');
                            }}
                            title="Kick user"
                          >
                            <UserX className="h-4 w-4 text-amber-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedUser(participant);
                              setActionType('ban');
                            }}
                            title="Ban user"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={async () => {
                    const { error } = await supabase
                      .from('room_messages')
                      .delete()
                      .eq('room_id', roomId);
                    
                    if (!error) {
                      toast({ title: "All messages cleared" });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Messages
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick Confirmation */}
      <AlertDialog open={actionType === 'kick'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.display_name} from this room?
              They can rejoin unless you ban them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleKick(selectedUser)}
              disabled={isProcessing}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Confirmation */}
      <AlertDialog open={actionType === 'ban'} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {selectedUser?.display_name}? 
              They will not be able to rejoin this room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Reason (optional)</Label>
            <Input
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleBan(selectedUser)}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RoomModeration;
