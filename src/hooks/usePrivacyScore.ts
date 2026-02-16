import { useState, useEffect, useCallback } from 'react';

export interface PrivacyEvent {
  id: string;
  type: 'tracker_blocked' | 'cookie_blocked' | 'fingerprint_blocked' | 'data_request_blocked' | 'local_processing';
  source: string;
  timestamp: Date;
  category: string;
}

export interface PrivacyScore {
  overall: number; // 0-100
  dataOnDevice: number; // percentage of data kept local
  trackersBlocked: number;
  cookiesBlocked: number;
  fingerprintAttempts: number;
  localProcessingRate: number; // percentage of AI queries processed locally
  totalEvents: number;
  recentEvents: PrivacyEvent[];
  streakDays: number;
  level: 'exposed' | 'guarded' | 'protected' | 'sovereign';
}

const STORAGE_KEY = 'shadowtalk-privacy-events';

export const usePrivacyScore = () => {
  const [score, setScore] = useState<PrivacyScore>({
    overall: 95,
    dataOnDevice: 100,
    trackersBlocked: 0,
    cookiesBlocked: 0,
    fingerprintAttempts: 0,
    localProcessingRate: 0,
    totalEvents: 0,
    recentEvents: [],
    streakDays: 1,
    level: 'protected',
  });

  // Load persisted events
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const events: PrivacyEvent[] = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
        recalculateScore(events);
      }
    } catch (e) {
      console.warn('[PrivacyScore] Failed to load events:', e);
    }
  }, []);

  // Simulate real-time privacy monitoring
  useEffect(() => {
    const simulateBlocking = () => {
      const types: PrivacyEvent['type'][] = ['tracker_blocked', 'cookie_blocked', 'fingerprint_blocked', 'data_request_blocked'];
      const sources = ['analytics.google.com', 'facebook.net', 'doubleclick.net', 'ads.twitter.com', 'clarity.ms', 'hotjar.com', 'segment.io', 'mixpanel.com'];
      const categories = ['Analytics', 'Advertising', 'Fingerprinting', 'Social Tracking'];

      const event: PrivacyEvent = {
        id: crypto.randomUUID(),
        type: types[Math.floor(Math.random() * types.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: new Date(),
        category: categories[Math.floor(Math.random() * categories.length)],
      };

      addEvent(event);
    };

    // Simulate blocking events periodically
    const interval = setInterval(simulateBlocking, 30000 + Math.random() * 60000);
    
    // Initial events
    for (let i = 0; i < 5; i++) {
      setTimeout(() => simulateBlocking(), i * 2000);
    }

    return () => clearInterval(interval);
  }, []);

  const recalculateScore = useCallback((events: PrivacyEvent[]) => {
    const trackersBlocked = events.filter(e => e.type === 'tracker_blocked').length;
    const cookiesBlocked = events.filter(e => e.type === 'cookie_blocked').length;
    const fingerprintAttempts = events.filter(e => e.type === 'fingerprint_blocked').length;
    const localProcessing = events.filter(e => e.type === 'local_processing').length;

    const totalBlocked = trackersBlocked + cookiesBlocked + fingerprintAttempts;
    const localRate = events.length > 0 ? Math.round((localProcessing / Math.max(events.length, 1)) * 100) : 85;

    // Calculate overall score
    const baseScore = 70;
    const blockingBonus = Math.min(totalBlocked * 0.5, 15);
    const localBonus = localRate * 0.15;
    const overall = Math.min(Math.round(baseScore + blockingBonus + localBonus), 100);

    let level: PrivacyScore['level'];
    if (overall >= 90) level = 'sovereign';
    else if (overall >= 70) level = 'protected';
    else if (overall >= 50) level = 'guarded';
    else level = 'exposed';

    // Get streak
    const storedStreak = parseInt(localStorage.getItem('shadowtalk-privacy-streak') || '1');

    setScore({
      overall,
      dataOnDevice: 100,
      trackersBlocked,
      cookiesBlocked,
      fingerprintAttempts,
      localProcessingRate: localRate,
      totalEvents: events.length,
      recentEvents: events.slice(-20).reverse(),
      streakDays: storedStreak,
      level,
    });
  }, []);

  const addEvent = useCallback((event: PrivacyEvent) => {
    setScore(prev => {
      const newEvents = [...prev.recentEvents, event].slice(-50);
      const allEvents = [...prev.recentEvents, event];

      // Persist
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        stored.push(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(-200)));
      } catch (e) { /* ignore */ }

      const trackersBlocked = prev.trackersBlocked + (event.type === 'tracker_blocked' ? 1 : 0);
      const cookiesBlocked = prev.cookiesBlocked + (event.type === 'cookie_blocked' ? 1 : 0);
      const fingerprintAttempts = prev.fingerprintAttempts + (event.type === 'fingerprint_blocked' ? 1 : 0);
      const totalBlocked = trackersBlocked + cookiesBlocked + fingerprintAttempts;

      const baseScore = 70;
      const blockingBonus = Math.min(totalBlocked * 0.5, 15);
      const localBonus = prev.localProcessingRate * 0.15;
      const overall = Math.min(Math.round(baseScore + blockingBonus + localBonus), 100);

      let level: PrivacyScore['level'];
      if (overall >= 90) level = 'sovereign';
      else if (overall >= 70) level = 'protected';
      else if (overall >= 50) level = 'guarded';
      else level = 'exposed';

      return {
        ...prev,
        overall,
        trackersBlocked,
        cookiesBlocked,
        fingerprintAttempts,
        totalEvents: prev.totalEvents + 1,
        recentEvents: newEvents.reverse(),
        level,
      };
    });
  }, []);

  const logLocalProcessing = useCallback(() => {
    addEvent({
      id: crypto.randomUUID(),
      type: 'local_processing',
      source: 'ShadowTalk AI',
      timestamp: new Date(),
      category: 'Local AI',
    });
  }, [addEvent]);

  return { score, addEvent, logLocalProcessing };
};
