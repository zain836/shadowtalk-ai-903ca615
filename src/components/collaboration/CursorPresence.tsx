import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserPresence } from "@/hooks/useRealtimePresence";

interface CursorPresenceProps {
  users: UserPresence[];
  containerRef?: React.RefObject<HTMLElement>;
}

const Cursor: React.FC<{ user: UserPresence }> = ({ user }) => {
  if (!user.cursor) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: user.cursor.x,
        y: user.cursor.y,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", damping: 30, stiffness: 500 }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-md"
      >
        <path
          d="M5.65376 12.4563L0.8 0.9L16.9 9.7L10.4 12.3L5.65376 12.4563Z"
          fill={user.avatarColor}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* User label */}
      <motion.div
        className="absolute left-5 top-5 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-lg"
        style={{ backgroundColor: user.avatarColor }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-white">{user.displayName}</span>
        {user.isTyping && (
          <span className="ml-1 opacity-75">typing...</span>
        )}
      </motion.div>
    </motion.div>
  );
};

export const CursorPresence: React.FC<CursorPresenceProps> = ({ users }) => {
  return (
    <AnimatePresence>
      {users.map((user) => (
        <Cursor key={user.id} user={user} />
      ))}
    </AnimatePresence>
  );
};

export default CursorPresence;
