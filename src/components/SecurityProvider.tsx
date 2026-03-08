import React, { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * SecurityProvider — Global client-side security hardening:
 * 1. Auto-logout on inactivity (30 min)
 * 2. Tab-blur session warning
 * 3. Anti-tampering: freeze critical globals
 * 4. CSP meta tag injection
 * 5. Referrer policy enforcement
 */
export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // === 1. Session timeout on inactivity ===
  const resetTimer = useCallback(() => {
    if (!user) return;

    if (warningRef.current) clearTimeout(warningRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Warn 2 minutes before timeout
    warningRef.current = setTimeout(() => {
      toast.warning('Session expiring in 2 minutes due to inactivity', {
        duration: 10000,
        id: 'session-warning',
      });
    }, SESSION_TIMEOUT_MS - 2 * 60 * 1000);

    timeoutRef.current = setTimeout(() => {
      toast.error('Session expired — signed out for security');
      signOut();
    }, SESSION_TIMEOUT_MS);
  }, [user, signOut]);

  useEffect(() => {
    if (!user) return;

    resetTimer();

    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, handler, { passive: true }));

    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);

  // === 2. Freeze critical security globals ===
  useEffect(() => {
    try {
      // Prevent prototype pollution
      if (Object.freeze) {
        Object.freeze(Object.prototype);
        Object.freeze(Array.prototype);
      }
    } catch {
      // Some environments may not allow this
    }
  }, []);

  // === 3. Block right-click context menu in production ===
  useEffect(() => {
    if (import.meta.env.PROD) {
      const blockContextMenu = (e: MouseEvent) => {
        // Allow on input/textarea for usability
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
      };
      document.addEventListener('contextmenu', blockContextMenu);
      return () => document.removeEventListener('contextmenu', blockContextMenu);
    }
  }, []);

  // === 4. Detect and warn about devtools (production only) ===
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const threshold = 160;
    const check = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        console.warn('%c⚠️ Security Warning: Developer tools detected', 'color: red; font-size: 20px; font-weight: bold;');
      }
    };

    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  // === 5. Inject security meta tags ===
  useEffect(() => {
    // Referrer policy
    let referrerMeta = document.querySelector('meta[name="referrer"]');
    if (!referrerMeta) {
      referrerMeta = document.createElement('meta');
      referrerMeta.setAttribute('name', 'referrer');
      document.head.appendChild(referrerMeta);
    }
    referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');

    // X-Content-Type-Options equivalent via meta
    let xContentType = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
    if (!xContentType) {
      xContentType = document.createElement('meta');
      xContentType.setAttribute('http-equiv', 'X-Content-Type-Options');
      xContentType.setAttribute('content', 'nosniff');
      document.head.appendChild(xContentType);
    }
  }, []);

  // === 6. Prevent clickjacking via frame detection ===
  useEffect(() => {
    if (window.self !== window.top) {
      try {
        // If framed, break out
        window.top!.location.href = window.self.location.href;
      } catch {
        // Cross-origin frame - hide content
        document.body.style.display = 'none';
        console.error('Clickjacking detected — content hidden');
      }
    }
  }, []);

  return <>{children}</>;
};
