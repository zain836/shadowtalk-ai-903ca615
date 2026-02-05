 # Collaborative Rooms Upgrade Plan
 
 ## Current State Analysis
 
 ### Existing Features
 - Basic room creation (public/private toggle)
 - Real-time chat with AI integration
 - Simple participant list
 - Invite links
 - Basic moderation (kick/ban by room creator)
 - Collaborative text editor with cursor presence
 - Real-time document sync with debounce
 - Presence avatars (online indicators)
 
 ### Database Tables
 - `chat_rooms` - Room metadata
 - `room_participants` - User membership
 - `room_messages` - Chat history
 - `room_documents` - Shared documents
 - `room_bans` - Ban records
 
 ---
 
 ## Phase 1: Enhanced Presence & Communication (Priority: High)
 
 ### 1.1 Live Cursors in Chat
 - [ ] Show floating cursors for all online users
 - [ ] Display cursor position in text input area
 - [ ] Smooth cursor animations with user colors
 
 ### 1.2 Typing Indicators (Chat)
 - [ ] Real-time "X is typing..." in chat view
 - [ ] Multiple user typing support ("X, Y are typing...")
 - [ ] Animated dots indicator
 
 ### 1.3 Message Reactions
 ```sql
 CREATE TABLE room_message_reactions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE,
   user_id UUID NOT NULL,
   emoji TEXT NOT NULL,
   created_at TIMESTAMPTZ DEFAULT now(),
   UNIQUE(message_id, user_id, emoji)
 );
 ```
 - [ ] Quick emoji picker (👍 ❤️ 😂 😮 😢 🔥)
 - [ ] Reaction counts on messages
 - [ ] Real-time reaction sync
 
 ### 1.4 Threaded Replies
 ```sql
 ALTER TABLE room_messages ADD COLUMN reply_to UUID REFERENCES room_messages(id);
 ALTER TABLE room_messages ADD COLUMN thread_count INT DEFAULT 0;
 ```
 - [ ] Reply-to-message functionality
 - [ ] Thread view expansion
 - [ ] Thread notification badges
 
 ### 1.5 @Mentions
 - [ ] User autocomplete on @ trigger
 - [ ] Highlight mentioned users
 - [ ] Notification for mentions (in-app)
 - [ ] Store mentions in message metadata
 
 ---
 
 ## Phase 2: Role-Based Access Control (Priority: High)
 
 ### 2.1 Room Roles System
 ```sql
 CREATE TYPE room_role AS ENUM ('owner', 'admin', 'moderator', 'member', 'guest');
 
 CREATE TABLE room_roles (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
   user_id UUID NOT NULL,
   role room_role NOT NULL DEFAULT 'member',
   granted_by UUID,
   granted_at TIMESTAMPTZ DEFAULT now(),
   UNIQUE(room_id, user_id)
 );
 
 CREATE FUNCTION has_room_role(p_room_id UUID, p_user_id UUID, p_roles room_role[])
 RETURNS BOOLEAN
 LANGUAGE SQL STABLE SECURITY DEFINER
 SET search_path = public
 AS $$
   SELECT EXISTS (
     SELECT 1 FROM room_roles
     WHERE room_id = p_room_id AND user_id = p_user_id AND role = ANY(p_roles)
   ) OR EXISTS (
     SELECT 1 FROM chat_rooms WHERE id = p_room_id AND created_by = p_user_id
   );
 $$;
 ```
 
 ### 2.2 Role Permissions Matrix
 | Permission | Owner | Admin | Moderator | Member | Guest |
 |------------|-------|-------|-----------|--------|-------|
 | Delete Room | ✅ | ❌ | ❌ | ❌ | ❌ |
 | Edit Settings | ✅ | ✅ | ❌ | ❌ | ❌ |
 | Manage Roles | ✅ | ✅ | ❌ | ❌ | ❌ |
 | Kick/Ban | ✅ | ✅ | ✅ | ❌ | ❌ |
 | Delete Messages | ✅ | ✅ | ✅ | ❌ | ❌ |
 | Pin Messages | ✅ | ✅ | ✅ | ❌ | ❌ |
 | Send Messages | ✅ | ✅ | ✅ | ✅ | ❌ |
 | Read Messages | ✅ | ✅ | ✅ | ✅ | ✅ |
 | Edit Documents | ✅ | ✅ | ✅ | ✅ | ❌ |
 
 ### 2.3 Role Management UI
 - [ ] Role assignment dialog
 - [ ] Role badges next to usernames
 - [ ] Permission tooltips
 
 ---
 
 ## Phase 3: Advanced Moderation (Priority: Medium)
 
 ### 3.1 Message Controls
 ```sql
 ALTER TABLE room_messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
 ALTER TABLE room_messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;
 ALTER TABLE room_messages ADD COLUMN edited_at TIMESTAMPTZ;
 ALTER TABLE room_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
 ```
 - [ ] Edit own messages (within 15 min)
 - [ ] Delete messages (soft delete)
 - [ ] Pin important messages
 - [ ] Show "(edited)" indicator
 
 ### 3.2 Slow Mode
 ```sql
 ALTER TABLE chat_rooms ADD COLUMN slow_mode_seconds INT DEFAULT 0;
 ```
 - [ ] Configurable message cooldown (0-60s)
 - [ ] Countdown timer in input
 - [ ] Moderators exempt
 
 ### 3.3 Room Settings
 ```sql
 ALTER TABLE chat_rooms ADD COLUMN settings JSONB DEFAULT '{}';
 -- settings: { password, allowGuests, maxMessages, archiveAfter }
 ```
 - [ ] Room password protection
 - [ ] Guest access toggle
 - [ ] Message history limit
 - [ ] Auto-archive after inactivity
 
 ---
 
 ## Phase 4: AI Integration (Priority: High)
 
 ### 4.1 Shared AI Assistant
 - [ ] AI responds to all room members
 - [ ] Context awareness (sees all messages)
 - [ ] Configurable AI personality per room
 
 ### 4.2 AI Commands
 - [ ] `/summarize` - Summarize conversation
 - [ ] `/translate [lang]` - Translate last message
 - [ ] `/explain` - Explain complex content
 - [ ] `/brainstorm [topic]` - Collaborative ideation
 
 ### 4.3 AI Moderation Assistant
 - [ ] Auto-detect inappropriate content
 - [ ] Suggest moderation actions
 - [ ] Content classification
 
 ---
 
 ## Phase 5: Content Sharing (Priority: Medium)
 
 ### 5.1 File Attachments
 ```sql
 CREATE TABLE room_attachments (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
   message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE,
   user_id UUID NOT NULL,
   file_name TEXT NOT NULL,
   file_type TEXT,
   file_size BIGINT,
   storage_path TEXT NOT NULL,
   created_at TIMESTAMPTZ DEFAULT now()
 );
 ```
 - [ ] Image uploads with preview
 - [ ] Document attachments (PDF, DOCX)
 - [ ] File size limits (10MB free, 100MB pro)
 - [ ] Storage bucket: `room-attachments`
 
 ### 5.2 Rich Embeds
 - [ ] URL preview cards
 - [ ] YouTube/Video embeds
 - [ ] Code snippet rendering
 - [ ] Image galleries
 
 ### 5.3 Collaborative Whiteboard
 - [ ] Canvas-based drawing
 - [ ] Real-time sync
 - [ ] Shape tools, colors
 - [ ] Export as image
 
 ---
 
 ## Phase 6: Full Workspace (Priority: Medium)
 
 ### 6.1 Multiple Documents
 ```sql
 ALTER TABLE room_documents ADD COLUMN title TEXT DEFAULT 'Untitled';
 ALTER TABLE room_documents ADD COLUMN doc_type TEXT DEFAULT 'text'; -- text, code, markdown
 ALTER TABLE room_documents ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
 CREATE INDEX idx_room_documents_room ON room_documents(room_id);
 ```
 - [ ] Document sidebar list
 - [ ] Create/rename/delete documents
 - [ ] Document type selector (Text, Code, Markdown)
 
 ### 6.2 Version History
 ```sql
 CREATE TABLE room_document_versions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   document_id UUID REFERENCES room_documents(id) ON DELETE CASCADE,
   content TEXT,
   created_by UUID,
   created_at TIMESTAMPTZ DEFAULT now()
 );
 ```
 - [ ] Auto-save versions (every 5 min or major change)
 - [ ] Version diff viewer
 - [ ] Restore previous versions
 
 ### 6.3 Project Boards (Kanban)
 ```sql
 CREATE TABLE room_boards (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
   title TEXT NOT NULL,
   columns JSONB DEFAULT '["To Do", "In Progress", "Done"]',
   created_at TIMESTAMPTZ DEFAULT now()
 );
 
 CREATE TABLE room_board_cards (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   board_id UUID REFERENCES room_boards(id) ON DELETE CASCADE,
   column_index INT NOT NULL,
   position INT NOT NULL,
   title TEXT NOT NULL,
   description TEXT,
   assigned_to UUID[],
   labels TEXT[],
   due_date TIMESTAMPTZ,
   created_at TIMESTAMPTZ DEFAULT now()
 );
 ```
 - [ ] Drag-and-drop cards
 - [ ] Assignees, labels, due dates
 - [ ] Card comments (linked to chat)
 
 ---
 
 ## Phase 7: Voice & Video (Priority: Low)
 
 ### 7.1 Voice Chat (WebRTC)
 - [ ] Push-to-talk voice
 - [ ] Voice activity detection
 - [ ] Mute/unmute controls
 - [ ] Integration with ShadowTalk Live
 
 ### 7.2 Screen Sharing
 - [ ] Share screen to room
 - [ ] Viewer-only mode
 - [ ] Drawing annotations
 
 ---
 
 ## Implementation Order
 
 1. **Week 1-2**: Phase 2 (Roles) + Phase 1.2-1.3 (Typing, Reactions)
 2. **Week 3-4**: Phase 3 (Moderation) + Phase 1.4-1.5 (Threads, Mentions)
 3. **Week 5-6**: Phase 4 (AI Integration)
 4. **Week 7-8**: Phase 5 (Content Sharing)
 5. **Week 9-10**: Phase 6 (Full Workspace)
 6. **Future**: Phase 7 (Voice/Video)
 
 ---
 
 ## Technical Considerations
 
 ### Real-time Architecture
 - Use Supabase Realtime for all sync
 - Throttle presence updates (50ms minimum)
 - Debounce document saves (500ms)
 - Use optimistic updates for reactions
 
 ### Security
 - All RLS policies use `has_room_role()` function
 - Storage policies restrict by room membership
 - Rate limiting on message sending
 - Input sanitization for all content
 
 ### Performance
 - Paginate messages (50 per load)
 - Lazy-load attachments
 - Virtual scrolling for long threads
 - Cache document versions client-side
 
 ---
 
 ## Next Steps
 
 To begin implementation, confirm which phase to start with. Recommended: **Phase 2 (Roles)** as it's foundational for all other features.