import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  installStealthNetworkGuard,
  isStealthAllowedUrl,
  uninstallStealthNetworkGuard,
} from "./stealthNetworkGuard";

describe("isStealthAllowedUrl", () => {
  it("allows same-origin relative paths", () => {
    expect(isStealthAllowedUrl("/api/foo")).toBe(true);
  });

  it("blocks external https URLs", () => {
    expect(isStealthAllowedUrl("https://api.openai.com/v1/chat")).toBe(false);
  });

  it("allows blob and data URLs", () => {
    expect(isStealthAllowedUrl("blob:abc")).toBe(true);
    expect(isStealthAllowedUrl("data:text/plain,hi")).toBe(true);
  });
});

describe("installStealthNetworkGuard", () => {
  beforeEach(() => {
    uninstallStealthNetworkGuard();
  });

  afterEach(() => {
    uninstallStealthNetworkGuard();
  });

  it("blocks fetch to external hosts and reports handler", async () => {
    const handler = vi.fn();
    installStealthNetworkGuard(handler);

    await expect(fetch("https://example.com/track")).rejects.toThrow(/Stealth Mode/);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/track",
        method: "FETCH",
      }),
    );
  });

  it("blocks WebSocket to external hosts", () => {
    const handler = vi.fn();
    installStealthNetworkGuard(handler);

    expect(() => new WebSocket("wss://example.com/socket")).toThrow(/Stealth Mode/);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ method: "WEBSOCKET" }),
    );
  });
});
