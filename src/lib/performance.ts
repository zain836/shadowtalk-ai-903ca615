 // Performance monitoring and optimization utilities
 
 // Web Vitals tracking
 export interface PerformanceMetrics {
   fcp?: number; // First Contentful Paint
   lcp?: number; // Largest Contentful Paint
   fid?: number; // First Input Delay
   cls?: number; // Cumulative Layout Shift
   ttfb?: number; // Time to First Byte
 }
 
 let metricsBuffer: PerformanceMetrics = {};
 
 // Collect Core Web Vitals
 export function initPerformanceMonitoring(): void {
   if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
     return;
   }
 
   // First Contentful Paint
   try {
     const fcpObserver = new PerformanceObserver((list) => {
       const entries = list.getEntries();
       const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
       if (fcp) {
         metricsBuffer.fcp = fcp.startTime;
       }
     });
     fcpObserver.observe({ entryTypes: ['paint'] });
   } catch (e) {
     // Observer not supported
   }
 
   // Largest Contentful Paint
   try {
     const lcpObserver = new PerformanceObserver((list) => {
       const entries = list.getEntries();
       const lastEntry = entries[entries.length - 1];
       if (lastEntry) {
         metricsBuffer.lcp = lastEntry.startTime;
       }
     });
     lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
   } catch (e) {
     // Observer not supported
   }
 
   // First Input Delay
   try {
     const fidObserver = new PerformanceObserver((list) => {
       const entries = list.getEntries();
       const firstEntry = entries[0];
       if (firstEntry && 'processingStart' in firstEntry) {
         metricsBuffer.fid = (firstEntry as PerformanceEventTiming).processingStart - firstEntry.startTime;
       }
     });
     fidObserver.observe({ entryTypes: ['first-input'] });
   } catch (e) {
     // Observer not supported
   }
 
   // Cumulative Layout Shift
   try {
     let clsValue = 0;
     const clsObserver = new PerformanceObserver((list) => {
       for (const entry of list.getEntries()) {
         if (!(entry as any).hadRecentInput) {
           clsValue += (entry as any).value;
           metricsBuffer.cls = clsValue;
         }
       }
     });
     clsObserver.observe({ entryTypes: ['layout-shift'] });
   } catch (e) {
     // Observer not supported
   }
 
   // Time to First Byte
   try {
     const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
     if (navigation) {
       metricsBuffer.ttfb = navigation.responseStart - navigation.requestStart;
     }
   } catch (e) {
     // Navigation timing not available
   }
 }
 
 export function getPerformanceMetrics(): PerformanceMetrics {
   return { ...metricsBuffer };
 }
 
 // Lazy load images with Intersection Observer
 export function setupLazyLoading(): void {
   if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
     return;
   }
 
   const lazyImages = document.querySelectorAll<HTMLImageElement>('img[data-src]');
   
   const imageObserver = new IntersectionObserver((entries) => {
     entries.forEach((entry) => {
       if (entry.isIntersecting) {
         const img = entry.target as HTMLImageElement;
         if (img.dataset.src) {
           img.src = img.dataset.src;
           img.removeAttribute('data-src');
           imageObserver.unobserve(img);
         }
       }
     });
   }, {
     rootMargin: '50px 0px',
     threshold: 0.01,
   });
 
   lazyImages.forEach((img) => imageObserver.observe(img));
 }
 
 // Prefetch critical resources
 export function prefetchCriticalResources(urls: string[]): void {
   if (typeof document === 'undefined') return;
   
   urls.forEach((url) => {
     const link = document.createElement('link');
     link.rel = 'prefetch';
     link.href = url;
     document.head.appendChild(link);
   });
 }
 
 // Debounce function for performance-sensitive operations
 export function debounce<T extends (...args: unknown[]) => unknown>(
   func: T,
   wait: number
 ): (...args: Parameters<T>) => void {
   let timeout: ReturnType<typeof setTimeout> | null = null;
   
   return (...args: Parameters<T>) => {
     if (timeout) clearTimeout(timeout);
     timeout = setTimeout(() => func(...args), wait);
   };
 }
 
 // Throttle function for scroll/resize handlers
 export function throttle<T extends (...args: unknown[]) => unknown>(
   func: T,
   limit: number
 ): (...args: Parameters<T>) => void {
   let inThrottle = false;
   
   return (...args: Parameters<T>) => {
     if (!inThrottle) {
       func(...args);
       inThrottle = true;
       setTimeout(() => (inThrottle = false), limit);
     }
   };
 }
 
 // Memory usage monitoring
 export function checkMemoryUsage(): { used: number; limit: number; percentage: number } | null {
   if (typeof performance === 'undefined' || !('memory' in performance)) {
     return null;
   }
   
   const memory = (performance as any).memory;
   return {
     used: memory.usedJSHeapSize,
     limit: memory.jsHeapSizeLimit,
     percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
   };
 }
 
 // Critical rendering path optimization
 export function deferNonCritical(callback: () => void): void {
   if ('requestIdleCallback' in window) {
     (window as any).requestIdleCallback(callback, { timeout: 2000 });
   } else {
     setTimeout(callback, 100);
   }
 }