type BlockHandler = () => void;

let installed = false;
let onBlocked: BlockHandler | null = null;
let originalFetch: typeof fetch | null = null;
let originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;

/** URLs that may still run while stealth kill switch is active (SPA shell + local dev). */
export function isStealthAllowedUrl(url: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("about:") ||
    trimmed.startsWith("javascript:")
  ) {
    return true;
  }
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const host = parsed.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (parsed.origin === window.location.origin) return true;
    return false;
  } catch {
    return trimmed.startsWith("/");
  }
}

export function installStealthNetworkGuard(handler: BlockHandler): void {
  onBlocked = handler;
  if (installed) return;
  installed = true;

  originalFetch = window.fetch.bind(window);
  originalXHROpen = XMLHttpRequest.prototype.open;

  window.fetch = function stealthFetch(...args: Parameters<typeof fetch>) {
    const input = args[0];
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    if (isStealthAllowedUrl(url)) {
      return originalFetch!(...args);
    }
    onBlocked?.();
    return Promise.reject(new Error("Network blocked by Stealth Mode"));
  };

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (isStealthAllowedUrl(urlStr)) {
      return originalXHROpen!.apply(this, [method, url, ...rest] as Parameters<XMLHttpRequest["open"]>);
    }
    onBlocked?.();
    throw new Error("Network blocked by Stealth Mode");
  };
}

export function uninstallStealthNetworkGuard(): void {
  if (!installed) return;
  if (originalFetch) window.fetch = originalFetch;
  if (originalXHROpen) XMLHttpRequest.prototype.open = originalXHROpen;
  originalFetch = null;
  originalXHROpen = null;
  installed = false;
  onBlocked = null;
}

export function isStealthNetworkGuardInstalled(): boolean {
  return installed;
}
