const GUEST_ARCHIVED_KEY = "shadowtalk_guest_archived_chats";

export function getGuestArchivedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(GUEST_ARCHIVED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function setGuestArchivedIds(ids: Set<string>): void {
  localStorage.setItem(GUEST_ARCHIVED_KEY, JSON.stringify([...ids]));
}

export function isConversationArchived(
  conversationId: string,
  archivedAt: string | null | undefined,
  guestArchived: Set<string>,
): boolean {
  return !!archivedAt || guestArchived.has(conversationId);
}
