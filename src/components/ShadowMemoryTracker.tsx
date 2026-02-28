import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useShadowMemoryContext } from '@/contexts/ShadowMemoryContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Invisible component that auto-logs navigation, auth, and page-level activity
 * into the on-device Shadow Memory.
 */
export const ShadowMemoryTracker = () => {
  const { isReady, log } = useShadowMemoryContext();
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  // Track page navigations
  useEffect(() => {
    if (!isReady) return;
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    const pageName = getPageName(location.pathname);
    log('navigation', `Visited ${pageName}`, location.pathname);
  }, [location.pathname, isReady, log]);

  // Track session start
  useEffect(() => {
    if (!isReady) return;
    log('system', 'Session started', `Device: ${getDeviceType()}`);
  }, [isReady]);

  // Track auth state changes
  useEffect(() => {
    if (!isReady) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') log('auth', 'Signed in');
      if (event === 'SIGNED_OUT') log('auth', 'Signed out');
      if (event === 'PASSWORD_RECOVERY') log('auth', 'Password recovery initiated');
    });
    return () => subscription.unsubscribe();
  }, [isReady, log]);

  return null;
};

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getPageName(path: string): string {
  const map: Record<string, string> = {
    '/': 'Home',
    '/chatbot': 'Chatbot',
    '/pricing': 'Pricing',
    '/auth': 'Auth',
    '/profile': 'Profile',
    '/marketplace': 'Marketplace',
    '/missioncontrol': 'Mission Control',
    '/presentations': 'Presentations',
    '/developers': 'Developers',
    '/privacy-score': 'Privacy Score',
    '/vault': 'Stealth Vault',
    '/knowledge': 'Knowledge Graph',
    '/research': 'Deep Research',
    '/strategy-lab': 'Strategy Lab',
    '/business-memory': 'Business Memory',
    '/shadow-memory': 'Shadow Memory',
    '/workspace': 'AI Workspace',
    '/strategy': 'Strategy Agent',
    '/billing': 'Billing',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
    '/security-audit': 'Security Audit',
    '/command-center': 'Command Center',
    '/transparency': 'Transparency',
  };
  return map[path] || path;
}

export default ShadowMemoryTracker;
