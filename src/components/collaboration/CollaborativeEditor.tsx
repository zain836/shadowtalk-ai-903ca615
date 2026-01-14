import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Circle, Pencil } from "lucide-react";
import { useRealtimePresence, type UserPresence } from "@/hooks/useRealtimePresence";
import { CursorPresence } from "./CursorPresence";

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  initialContent = "",
  onContentChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    otherUsers,
    onlineUsers,
    isConnected,
    updateCursor,
    updateSelection,
    setTypingStatus,
  } = useRealtimePresence({
    channelName: `document:${documentId}`,
    throttleMs: 50,
  });

  // Track mouse movement
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      updateCursor({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [updateCursor]
  );

  // Track text selection
  const handleSelect = useCallback(() => {
    if (!editorRef.current) return;
    updateSelection({
      start: editorRef.current.selectionStart,
      end: editorRef.current.selectionEnd,
    });
  }, [updateSelection]);

  // Track typing
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      onContentChange?.(newContent);
      setTypingStatus(true);

      // Clear typing indicator after delay
      const timeout = setTimeout(() => setTypingStatus(false), 1000);
      return () => clearTimeout(timeout);
    },
    [onContentChange, setTypingStatus]
  );

  // Render selection highlights from other users
  const renderSelectionHighlights = () => {
    return otherUsers
      .filter((user) => user.selection && user.selection.start !== user.selection.end)
      .map((user) => (
        <div
          key={`selection-${user.id}`}
          className="absolute pointer-events-none"
          style={{
            backgroundColor: `${user.avatarColor}30`,
            border: `2px solid ${user.avatarColor}`,
            borderRadius: "2px",
          }}
        />
      ));
  };

  return (
    <Card className="w-full h-full" ref={containerRef} onMouseMove={handleMouseMove}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Collaborative Document
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <Circle
                className={`h-2 w-2 ${isConnected ? "fill-success text-success" : "fill-muted text-muted"}`}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>

            {/* Online Users */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 5).map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                        <AvatarFallback
                          style={{ backgroundColor: user.avatarColor }}
                          className="text-white text-xs"
                        >
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex items-center gap-2">
                        <span>{user.displayName}</span>
                        {user.isTyping && (
                          <Badge variant="secondary" className="text-xs">
                            typing...
                          </Badge>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {onlineUsers.length > 5 && (
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      +{onlineUsers.length - 5}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {/* Cursor Presence Layer */}
        <CursorPresence users={otherUsers} />

        {/* Selection Highlights */}
        {renderSelectionHighlights()}

        {/* Editor */}
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleInput}
          onSelect={handleSelect}
          className="w-full h-96 p-4 bg-muted/50 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          placeholder="Start typing... Others will see your changes in real-time."
        />

        {/* Typing Indicators */}
        {otherUsers.filter((u) => u.isTyping).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <span>
              {otherUsers
                .filter((u) => u.isTyping)
                .map((u) => u.displayName)
                .join(", ")}{" "}
              {otherUsers.filter((u) => u.isTyping).length === 1 ? "is" : "are"} typing...
            </span>
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;
