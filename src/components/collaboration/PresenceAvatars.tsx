import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { UserPresence } from "@/hooks/useRealtimePresence";

interface PresenceAvatarsProps {
  users: UserPresence[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  showTypingIndicator?: boolean;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({
  users,
  maxVisible = 5,
  size = "md",
  showTypingIndicator = true,
}) => {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;
  const typingUsers = users.filter((u) => u.isTyping);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div
                className="relative"
                style={{ zIndex: visibleUsers.length - index }}
              >
                <Avatar
                  className={`${sizeClasses[size]} border-2 border-background cursor-pointer transition-transform hover:scale-110 hover:z-50`}
                >
                  <AvatarFallback
                    style={{ backgroundColor: user.avatarColor }}
                    className="text-white font-medium"
                  >
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.isTyping && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{user.displayName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                {user.isTyping && (
                  <Badge variant="secondary" className="text-xs w-fit">
                    Currently typing...
                  </Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={`${sizeClasses[size]} border-2 border-background cursor-pointer`}>
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="flex flex-col gap-1">
                {users.slice(maxVisible).map((user) => (
                  <span key={user.id} className="text-sm">{user.displayName}</span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {showTypingIndicator && typingUsers.length > 0 && (
        <div className="text-xs text-muted-foreground animate-pulse">
          {typingUsers.length === 1
            ? `${typingUsers[0].displayName} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing...`
            : `${typingUsers.length} people are typing...`}
        </div>
      )}
    </div>
  );
};

export default PresenceAvatars;
