import { useCallback } from 'react';
import { useLocalVectorStore } from './useLocalVectorStore';

/**
 * Hook to index conversation messages into the local vector store
 * for RAG-based conversation memory retrieval across sessions.
 */
export const useConversationMemory = () => {
  const {
    addDocument,
    search,
    removeDocument,
    entryCount,
    initialize,
    clearStore,
  } = useLocalVectorStore();

  // Index a conversation turn into the vector store
  const indexMessage = useCallback(async (
    message: string,
    metadata?: {
      conversationId?: string;
      role?: string;
      topic?: string;
      timestamp?: string;
    }
  ) => {
    // Skip very short messages
    if (message.length < 20) return;

    const metaRecord: Record<string, string> = {};
    if (metadata?.conversationId) metaRecord.conversationId = metadata.conversationId;
    if (metadata?.role) metaRecord.role = metadata.role;
    if (metadata?.topic) metaRecord.topic = metadata.topic;
    if (metadata?.timestamp) metaRecord.timestamp = metadata.timestamp;

    return addDocument(message, metaRecord);
  }, [addDocument]);

  // Index an entire conversation (summary or full)
  const indexConversation = useCallback(async (
    messages: Array<{ role: string; content: string }>,
    conversationId: string,
    topic?: string
  ) => {
    // Create a summary of the conversation for indexing
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    const assistantMessages = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content.substring(0, 500))
      .join(' ');

    // Index the combined conversation context
    if (userMessages.length > 20) {
      await addDocument(
        `User discussed: ${userMessages.substring(0, 1000)}`,
        { conversationId, role: 'user', topic: topic || 'general' }
      );
    }

    if (assistantMessages.length > 20) {
      await addDocument(
        `AI provided: ${assistantMessages.substring(0, 1000)}`,
        { conversationId, role: 'assistant', topic: topic || 'general' }
      );
    }
  }, [addDocument]);

  // Recall relevant past conversations
  const recallMemories = useCallback(async (
    query: string,
    limit: number = 5
  ) => {
    return search(query, limit, 0.1);
  }, [search]);

  return {
    indexMessage,
    indexConversation,
    recallMemories,
    removeMemory: removeDocument,
    memoryCount: entryCount,
    initialize,
    clearMemories: clearStore,
  };
};
