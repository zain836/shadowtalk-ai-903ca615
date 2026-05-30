import type { StealthBlockEvent } from "@/lib/stealthTypes";

export type StealthBlockHandler = (event: StealthBlockEvent) => void;

let installed = false;
let onBlocked: StealthBlockHandler | null = null;
let originalFetch: typeof fetch | null = null;
let originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
let originalSendBeacon: typeof navigator.sendBeacon | null = null;
let OriginalWebSocket: typeof WebSocket | null = null;
let OriginalEventSource: typeof EventSource | null = null;

function getNativeEventSource(): typeof EventSource | null {
  try {
    if (typeof EventSource === "undefined" || !EventSource.prototype) return null;
    return EventSource;
  } catch {
    return null;
  }
}

function reportBlock(url: string, method: string) {
  onBlocked?.({
    url: url.slice(0, 512),
    method,
    at: new Date().toISOString(),
  });
}

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

export function installStealthNetworkGuard(handler: StealthBlockHandler): void {
  onBlocked = handler;
  if (installed) return;
  installed = true;

  originalFetch = window.fetch.bind(window);
  originalXHROpen = XMLHttpRequest.prototype.open;
  originalSendBeacon = navigator.sendBeacon.bind(navigator);
  OriginalWebSocket = typeof WebSocket !== "undefined" ? window.WebSocket : null;
  OriginalEventSource = getNativeEventSource();

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
    reportBlock(url, "FETCH");
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
    reportBlock(urlStr, method.toUpperCase() || "XHR");
    throw new Error("Network blocked by Stealth Mode");
  };

  navigator.sendBeacon = function stealthSendBeacon(url: string | URL, data?: BodyInit | null) {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (isStealthAllowedUrl(urlStr)) {
      return originalSendBeacon!(url, data);
    }
    reportBlock(urlStr, "BEACON");
    return false;
  };

  if (OriginalWebSocket) {
    window.WebSocket = function StealthWebSocket(
      url: string | URL,
      protocols?: string | string[],
    ) {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (isStealthAllowedUrl(urlStr)) {
        return new OriginalWebSocket!(url, protocols);
      }
      reportBlock(urlStr, "WEBSOCKET");
      throw new Error("Network blocked by Stealth Mode");
    } as typeof WebSocket;
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    Object.defineProperty(window.WebSocket, "CONNECTING", { value: OriginalWebSocket.CONNECTING });
    Object.defineProperty(window.WebSocket, "OPEN", { value: OriginalWebSocket.OPEN });
    Object.defineProperty(window.WebSocket, "CLOSING", { value: OriginalWebSocket.CLOSING });
    Object.defineProperty(window.WebSocket, "CLOSED", { value: OriginalWebSocket.CLOSED });
  }

  if (OriginalEventSource) {
    window.EventSource = function StealthEventSource(url: string | URL, init?: EventSourceInit) {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (isStealthAllowedUrl(urlStr)) {
        return new OriginalEventSource!(url, init);
      }
      reportBlock(urlStr, "EVENTSOURCE");
      throw new Error("Network blocked by Stealth Mode");
    } as typeof EventSource;
    window.EventSource.prototype = OriginalEventSource.prototype;
  }
}

export function uninstallStealthNetworkGuard(): void {
  if (!installed) return;
  if (originalFetch) window.fetch = originalFetch;
  if (originalXHROpen) XMLHttpRequest.prototype.open = originalXHROpen;
  if (originalSendBeacon) navigator.sendBeacon = originalSendBeacon;
  if (OriginalWebSocket) window.WebSocket = OriginalWebSocket;
  if (OriginalEventSource) window.EventSource = OriginalEventSource;
  originalFetch = null;
  originalXHROpen = null;
  originalSendBeacon = null;
  OriginalWebSocket = null;
  OriginalEventSource = null;
  installed = false;
  onBlocked = null;
}

export function isStealthNetworkGuardInstalled(): boolean {
  return installed;
}
