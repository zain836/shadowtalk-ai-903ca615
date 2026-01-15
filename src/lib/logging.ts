export interface ClientErrorContext {
  feature: string;
  action?: string;
  userId?: string;
  workspaceId?: string;
  severity?: 'info' | 'warning' | 'error';
  extra?: Record<string, unknown>;
}

export function logClientError(error: unknown, context: ClientErrorContext): void {
  // Central place to hook in Sentry/Logflare/etc. later.
  // For now we normalize and send to console.error so it is easy to grep.
  const normalized = error instanceof Error ? { message: error.message, stack: error.stack } : error;
  // eslint-disable-next-line no-console
  console.error('[ClientError]', { ...context, error: normalized });
}