/** Maps help-center article titles to in-app destinations */
export const HELP_ARTICLE_ROUTES: Record<string, string> = {
  "How to get started with ShadowTalk AI": "/docs",
  "Understanding AI personalities and modes": "/chatbot",
  "Setting up offline mode for local AI": "/profile?tab=preferences",
  "Managing your subscription and billing": "/billing",
  "Integrating with external APIs": "/api",
  "Best practices for prompt engineering": "/docs",
};

export function getHelpArticleRoute(title: string): string {
  return HELP_ARTICLE_ROUTES[title] ?? "/faq";
}
