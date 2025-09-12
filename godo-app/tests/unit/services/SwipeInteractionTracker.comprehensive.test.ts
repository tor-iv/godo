/**
 * @fileoverview Comprehensive SwipeInteractionTracker Tests
 * @author Testing Team
 * @description Complete test suite for SwipeInteractionTracker with state management and analytics
 */

import { SwipeInteractionTracker } from '../../../src/services/SwipeInteractionTracker';
import { SwipeDirection } from '../../../src/types';

describe('SwipeInteractionTracker - Comprehensive Tests', () => {
  let tracker: SwipeInteractionTracker;

  beforeEach(() => {
    // Reset singleton instance for each test
    (SwipeInteractionTracker as any).instance = undefined;
    tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = SwipeInteractionTracker.getInstance();
      const instance2 = SwipeInteractionTracker.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(tracker);
    });

    it('should maintain state across getInstance calls', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      
      const newInstance = SwipeInteractionTracker.getInstance();
      expect(newInstance.hasPerformedAnySwipe()).toBe(true);
    });
  });

  describe('Basic Swipe Recording', () => {
    it('should record individual swipe directions', () => {
      expect(tracker.hasPerformedAnySwipe()).toBe(false);
      
      tracker.recordSwipe(SwipeDirection.RIGHT);
      
      expect(tracker.hasPerformedAnySwipe()).toBe(true);
      expect(tracker.hasPerformedCalendarSwipe()).toBe(true);
    });

    it('should record multiple swipes correctly', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.LEFT);
      tracker.recordSwipe(SwipeDirection.UP);
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      expect(tracker.getTotalSwipeCount()).toBe(4);
      expect(tracker.getSwipeCount(SwipeDirection.RIGHT)).toBe(1);
      expect(tracker.getSwipeCount(SwipeDirection.LEFT)).toBe(1);
      expect(tracker.getSwipeCount(SwipeDirection.UP)).toBe(1);
      expect(tracker.getSwipeCount(SwipeDirection.DOWN)).toBe(1);
    });

    it('should track timestamps for swipes', () => {
      const beforeTime = new Date();
      tracker.recordSwipe(SwipeDirection.RIGHT);
      const afterTime = new Date();
      
      const recentSwipes = tracker.getRecentSwipes(1);
      expect(recentSwipes).toHaveLength(1);
      
      const swipeTime = recentSwipes[0].timestamp;
      expect(swipeTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(swipeTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('Calendar Swipe Detection', () => {
    it('should detect RIGHT swipes as calendar swipes', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      
      expect(tracker.hasPerformedCalendarSwipe()).toBe(true);
    });

    it('should detect UP swipes as calendar swipes', () => {
      tracker.recordSwipe(SwipeDirection.UP);
      
      expect(tracker.hasPerformedCalendarSwipe()).toBe(true);
    });

    it('should not consider LEFT or DOWN as calendar swipes', () => {
      tracker.recordSwipe(SwipeDirection.LEFT);
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      expect(tracker.hasPerformedCalendarSwipe()).toBe(false);
      expect(tracker.hasPerformedAnySwipe()).toBe(true);
    });

    it('should detect save swipes (DOWN) correctly', () => {
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      expect(tracker.hasPerformedSaveSwipe()).toBe(true);
      expect(tracker.hasPerformedCalendarSwipe()).toBe(false);
    });
  });

  describe('Statistics and Analytics', () => {
    it('should provide accurate swipe statistics', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.UP);
      tracker.recordSwipe(SwipeDirection.DOWN);
      tracker.recordSwipe(SwipeDirection.LEFT);
      
      const stats = tracker.getSwipeStats();
      
      expect(stats).toEqual({
        total: 5,
        calendarSwipes: 3, // 2 RIGHT + 1 UP
        saveSwipes: 1,     // 1 DOWN
        passSwipes: 1,     // 1 LEFT
        hasEngaged: true,
        shouldShowToggle: true,
      });
    });

    it('should calculate calendar swipes correctly', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.UP);
      
      const stats = tracker.getSwipeStats();
      expect(stats.calendarSwipes).toBe(3);
    });

    it('should return false for shouldShowToggle when no calendar swipes', () => {
      tracker.recordSwipe(SwipeDirection.LEFT);
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      const stats = tracker.getSwipeStats();
      expect(stats.shouldShowToggle).toBe(false);
      expect(stats.hasEngaged).toBe(true);
    });

    it('should return accurate engagement levels', () => {
      expect(tracker.getEngagementLevel()).toBe('none');
      
      tracker.recordSwipe(SwipeDirection.RIGHT);
      expect(tracker.getEngagementLevel()).toBe('minimal');
      
      for (let i = 0; i < 3; i++) {
        tracker.recordSwipe(SwipeDirection.LEFT);
      }
      expect(tracker.getEngagementLevel()).toBe('moderate');
      
      for (let i = 0; i < 10; i++) {
        tracker.recordSwipe(SwipeDirection.UP);
      }
      expect(tracker.getEngagementLevel()).toBe('high');
    });
  });

  describe('Recent Swipes History', () => {
    it('should return recent swipes in reverse chronological order', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.UP);
      tracker.recordSwipe(SwipeDirection.LEFT);
      
      const recent = tracker.getRecentSwipes(3);
      
      expect(recent).toHaveLength(3);
      expect(recent[0].direction).toBe(SwipeDirection.LEFT); // Most recent first
      expect(recent[1].direction).toBe(SwipeDirection.UP);
      expect(recent[2].direction).toBe(SwipeDirection.RIGHT); // Oldest last
    });

    it('should limit results to requested count', () => {
      for (let i = 0; i < 15; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
      }
      
      const recent = tracker.getRecentSwipes(10);
      expect(recent).toHaveLength(10);
    });

    it('should return all swipes when count exceeds total', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.LEFT);
      
      const recent = tracker.getRecentSwipes(10);
      expect(recent).toHaveLength(2);
    });

    it('should default to 10 recent swipes', () => {
      for (let i = 0; i < 15; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
      }
      
      const recent = tracker.getRecentSwipes();
      expect(recent).toHaveLength(10);
    });
  });

  describe('State Management', () => {
    it('should reset all tracking data', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.UP);
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      expect(tracker.hasPerformedAnySwipe()).toBe(true);
      expect(tracker.getTotalSwipeCount()).toBe(3);
      
      tracker.reset();
      
      expect(tracker.hasPerformedAnySwipe()).toBe(false);
      expect(tracker.getTotalSwipeCount()).toBe(0);
      expect(tracker.hasPerformedCalendarSwipe()).toBe(false);
      expect(tracker.hasPerformedSaveSwipe()).toBe(false);
      expect(tracker.getEngagementLevel()).toBe('none');
    });

    it('should export complete state for debugging', () => {
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      const exportedState = tracker.exportState();
      
      expect(exportedState).toHaveProperty('hasSwipedToCalendar', true);
      expect(exportedState).toHaveProperty('hasSwipedToSaved', true);
      expect(exportedState).toHaveProperty('hasSwipedPassed', false);
      expect(exportedState).toHaveProperty('swipeHistory');
      expect(exportedState).toHaveProperty('stats');
      
      const history = (exportedState as any).swipeHistory;
      expect(history).toHaveLength(2);
      expect(history[0].direction).toBe(SwipeDirection.RIGHT);
      expect(history[1].direction).toBe(SwipeDirection.DOWN);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of swipes efficiently', () => {
      const startTime = Date.now();
      
      // Record 1000 swipes
      for (let i = 0; i < 1000; i++) {
        const directions = [SwipeDirection.RIGHT, SwipeDirection.LEFT, SwipeDirection.UP, SwipeDirection.DOWN];
        tracker.recordSwipe(directions[i % 4]);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(tracker.getTotalSwipeCount()).toBe(1000);
    });

    it('should calculate statistics efficiently on large datasets', () => {
      // Record many swipes
      for (let i = 0; i < 500; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
        tracker.recordSwipe(SwipeDirection.LEFT);
      }
      
      const startTime = Date.now();
      const stats = tracker.getSwipeStats();
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Should be very fast
      expect(stats.total).toBe(1000);
      expect(stats.calendarSwipes).toBe(500);
      expect(stats.passSwipes).toBe(500);
    });

    it('should retrieve recent swipes efficiently', () => {
      // Record many swipes
      for (let i = 0; i < 1000; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
      }
      
      const startTime = Date.now();
      const recent = tracker.getRecentSwipes(100);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50); // Should be very fast
      expect(recent).toHaveLength(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive swipes', () => {
      const directions = [SwipeDirection.RIGHT, SwipeDirection.LEFT, SwipeDirection.UP, SwipeDirection.DOWN];
      
      // Record many swipes rapidly
      for (let i = 0; i < 100; i++) {
        tracker.recordSwipe(directions[i % 4]);
      }
      
      expect(tracker.getTotalSwipeCount()).toBe(100);
      expect(tracker.getEngagementLevel()).toBe('high');
    });

    it('should maintain correct counts with mixed swipe patterns', () => {
      // Complex swipe pattern
      for (let i = 0; i < 3; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
      }
      for (let i = 0; i < 2; i++) {
        tracker.recordSwipe(SwipeDirection.UP);
      }
      for (let i = 0; i < 4; i++) {
        tracker.recordSwipe(SwipeDirection.LEFT);
      }
      for (let i = 0; i < 1; i++) {
        tracker.recordSwipe(SwipeDirection.DOWN);
      }
      
      expect(tracker.getSwipeCount(SwipeDirection.RIGHT)).toBe(3);
      expect(tracker.getSwipeCount(SwipeDirection.UP)).toBe(2);
      expect(tracker.getSwipeCount(SwipeDirection.LEFT)).toBe(4);
      expect(tracker.getSwipeCount(SwipeDirection.DOWN)).toBe(1);
      expect(tracker.getTotalSwipeCount()).toBe(10);
    });

    it('should handle invalid or edge case inputs gracefully', () => {
      expect(() => {
        tracker.getRecentSwipes(0);
        tracker.getRecentSwipes(-1);
        tracker.getSwipeCount(null as any);
      }).not.toThrow();
      
      const zeroRecent = tracker.getRecentSwipes(0);
      const negativeRecent = tracker.getRecentSwipes(-1);
      
      expect(zeroRecent).toEqual([]);
      expect(negativeRecent).toEqual([]);
    });

    it('should maintain state consistency after multiple operations', () => {
      // Perform various operations
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.getSwipeStats();
      tracker.recordSwipe(SwipeDirection.LEFT);
      tracker.getRecentSwipes(5);
      tracker.recordSwipe(SwipeDirection.UP);
      const exported = tracker.exportState();
      
      // Verify consistency
      expect(tracker.getTotalSwipeCount()).toBe(3);
      expect(tracker.hasPerformedCalendarSwipe()).toBe(true);
      expect((exported as any).swipeHistory).toHaveLength(3);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly in a typical user workflow', () => {
      // User starts browsing events
      expect(tracker.getEngagementLevel()).toBe('none');
      expect(tracker.getSwipeStats().shouldShowToggle).toBe(false);
      
      // User passes on first event
      tracker.recordSwipe(SwipeDirection.LEFT);
      expect(tracker.getEngagementLevel()).toBe('minimal');
      expect(tracker.getSwipeStats().shouldShowToggle).toBe(false);
      
      // User saves an event to calendar
      tracker.recordSwipe(SwipeDirection.RIGHT);
      expect(tracker.hasPerformedCalendarSwipe()).toBe(true);
      expect(tracker.getSwipeStats().shouldShowToggle).toBe(true);
      
      // User continues swiping
      for (let i = 0; i < 5; i++) {
        tracker.recordSwipe(SwipeDirection.LEFT);
      }
      tracker.recordSwipe(SwipeDirection.UP); // Add to public calendar
      
      const finalStats = tracker.getSwipeStats();
      expect(finalStats.calendarSwipes).toBe(2); // RIGHT + UP
      expect(finalStats.passSwipes).toBe(6);     // 1 + 5 LEFT swipes
      expect(finalStats.shouldShowToggle).toBe(true);
      expect(tracker.getEngagementLevel()).toBe('moderate');
    });

    it('should track user behavior patterns accurately', () => {
      // Simulate a picky user (mostly passes)
      for (let i = 0; i < 20; i++) {
        tracker.recordSwipe(SwipeDirection.LEFT);
      }
      tracker.recordSwipe(SwipeDirection.RIGHT); // Finally finds something interesting
      
      const stats = tracker.getSwipeStats();
      expect(stats.passSwipes).toBe(20);
      expect(stats.calendarSwipes).toBe(1);
      expect(stats.total).toBe(21);
      expect(tracker.getEngagementLevel()).toBe('high');
      
      // Simulate an engaged user
      tracker.reset();
      for (let i = 0; i < 5; i++) {
        tracker.recordSwipe(SwipeDirection.RIGHT);
        tracker.recordSwipe(SwipeDirection.UP);
      }
      
      const engagedStats = tracker.getSwipeStats();
      expect(engagedStats.calendarSwipes).toBe(10);
      expect(engagedStats.passSwipes).toBe(0);
      expect(tracker.getEngagementLevel()).toBe('moderate');
    });
  });
});