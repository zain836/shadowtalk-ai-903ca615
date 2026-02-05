import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  displayName: string;
  email?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  users: User[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MentionInput = ({
  value,
  onChange,
  onSubmit,
  users,
  placeholder = "Type a message...",
  disabled = false,
  className,
}: MentionInputProps) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter users based on mention search
  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  // Detect @ symbol and show mention popup
  useEffect(() => {
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex < cursorPosition) {
      const searchText = value.slice(lastAtIndex + 1, cursorPosition);
      // Only show if no space after @
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, [value, cursorPosition]);

  // Handle keyboard navigation in mention popup
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showMentions) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredUsers[mentionIndex]) {
          selectMention(filteredUsers[mentionIndex]);
        }
        break;
      case 'Escape':
        setShowMentions(false);
        break;
    }
  }, [showMentions, mentionIndex, filteredUsers, onSubmit]);

  // Insert mention into text
  const selectMention = (user: User) => {
    const lastAtIndex = value.lastIndexOf('@');
    const before = value.slice(0, lastAtIndex);
    const after = value.slice(cursorPosition);
    const newValue = `${before}@${user.displayName} ${after}`;
    onChange(newValue);
    setShowMentions(false);
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
      const newPosition = before.length + user.displayName.length + 2;
      inputRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPosition((e.target as HTMLInputElement).selectionStart || 0);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-4"
      />
      
      {/* Mention Popup */}
      <AnimatePresence>
        {showMentions && filteredUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="p-2 border-b border-border">
              <p className="text-xs text-muted-foreground">Mention someone</p>
            </div>
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {filteredUsers.map((user, index) => (
                  <motion.button
                    key={user.id}
                    onClick={() => selectMention(user)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors",
                      index === mentionIndex 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted"
                    )}
                    whileHover={{ x: 2 }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={getAvatarColor(user.displayName)}>
                        {user.displayName[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.displayName}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      )}
                    </div>
                    {index === mentionIndex && (
                      <kbd className="text-[10px] px-1 py-0.5 rounded bg-muted">↵</kbd>
                    )}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mention Highlight */}
      {showMentions && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="text-xs text-primary animate-pulse">@</span>
        </div>
      )}
    </div>
  );
};

// Utility to parse mentions from message content
export const parseMentions = (content: string, users: User[]): React.ReactNode[] => {
  const mentionRegex = /@(\w+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    const mentionedUser = users.find(u => 
      u.displayName.toLowerCase() === match[1].toLowerCase()
    );
    
    if (mentionedUser) {
      parts.push(
        <span 
          key={match.index} 
          className="text-primary font-medium bg-primary/10 px-1 rounded"
        >
          @{match[1]}
        </span>
      );
    } else {
      parts.push(`@${match[1]}`);
    }
    
    lastIndex = mentionRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts;
};
