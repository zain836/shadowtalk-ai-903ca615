/** Infer query category from message text for behavior learning. */
export function inferQueryCategory(text: string): string {
  const t = text.toLowerCase();
  if (/\b(debug|stack trace|exception|error line|fix this bug)\b/.test(t)) return "debug";
  if (/\b(typescript|javascript|python|react|api|function|class |import |npm |code)\b/.test(t)) return "code";
  if (/\b(translate|translation|in spanish|in french|auf deutsch)\b/.test(t)) return "translate";
  if (/\b(summarize|summary|tl;dr|key points)\b/.test(t)) return "summarize";
  if (/\b(brainstorm|ideas for|creative concepts)\b/.test(t)) return "brainstorm";
  if (/\b(image|picture|draw|illustrate|logo design)\b/.test(t)) return "image";
  if (/\b(research|competitor|market|compare|analysis|report|audit)\b/.test(t)) return "research";
  if (/\b(email|outreach|campaign|newsletter)\b/.test(t)) return "email";
  if (/\b(math|equation|calculate|derivative|integral)\b/.test(t)) return "math";
  if (/\b(explain|what is|how does|teach me)\b/.test(t)) return "explain";
  if (/\b(write|story|poem|creative)\b/.test(t)) return "creative";
  return "general";
}
