import { InteractionManager, Platform } from 'react-native';
import * as React from 'react';

/**
 * Performance utilities for React Native mobile optimization
 */
export class PerformanceUtils {
  // Debounce function for high-frequency events
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    };
  }

  // Throttle function for limiting execution frequency
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Run expensive operations after interactions are complete
  static runAfterInteractions(callback: () => void): void {
    InteractionManager.runAfterInteractions(callback);
  }

  // Platform-specific performance optimizations
  static getPlatformOptimizedProps() {
    return Platform.select({
      ios: {
        removeClippedSubviews: false, // Better for iOS
        maxToRenderPerBatch: 10,
        windowSize: 10,
        initialNumToRender: 5,
      },
      android: {
        removeClippedSubviews: true, // Better for Android memory
        maxToRenderPerBatch: 5,
        windowSize: 5,
        initialNumToRender: 3,
      },
      default: {
        removeClippedSubviews: false,
        maxToRenderPerBatch: 8,
        windowSize: 8,
        initialNumToRender: 4,
      },
    });
  }

  // Memory optimization for large lists
  static getListOptimization() {
    return {
      // Reduce memory footprint
      removeClippedSubviews: true,
      // Optimize rendering
      getItemLayout: (data: any[], index: number) => ({
        length: 100, // Approximate item height
        offset: 100 * index,
        index,
      }),
      // Key extractor for better performance
      keyExtractor: (item: any, index: number) =>
        item?.id?.toString() || `item-${index}`,
    };
  }

  // Image optimization settings
  static getImageOptimization() {
    return Platform.select({
      ios: {
        resizeMode: 'cover' as const,
        fadeDuration: 0, // Disable fade on iOS for better performance
      },
      android: {
        resizeMode: 'cover' as const,
        fadeDuration: 200, // Keep fade on Android
        resizeMethod: 'resize' as const, // Better for Android
      },
    });
  }
}

/**
 * Hook for performance monitoring (development only)
 */
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    if (!__DEV__) return;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;

      if (renderTime > 100) {
        // Slow component render detected - consider optimization
      }
    };
  }, [componentName]);
};

/**
 * Memory management utilities
 */
export class MemoryUtils {
  // Clean up timers and subscriptions
  static createCleanupManager() {
    const timers: NodeJS.Timeout[] = [];
    const subscriptions: (() => void)[] = [];

    return {
      addTimer: (timer: NodeJS.Timeout) => {
        timers.push(timer);
      },
      addSubscription: (cleanup: () => void) => {
        subscriptions.push(cleanup);
      },
      cleanup: () => {
        timers.forEach(clearTimeout);
        subscriptions.forEach(cleanup => cleanup());
        timers.length = 0;
        subscriptions.length = 0;
      },
    };
  }

  // Optimize object creation in render methods
  static memoizeStyles = <T extends Record<string, any>>(
    createStyles: () => T
  ): T => {
    let cachedStyles: T | null = null;

    return new Proxy({} as T, {
      get(target, prop) {
        if (!cachedStyles) {
          cachedStyles = createStyles();
        }
        return cachedStyles[prop as keyof T];
      },
    });
  };
}
