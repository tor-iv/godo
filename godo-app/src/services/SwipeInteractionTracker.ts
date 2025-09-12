import { SwipeDirection } from '../types';

/**
 * SwipeInteractionTracker
 *
 * Tracks user swipe interactions to determine when UI elements
 * like the EventFilterToggle should be revealed. This ensures
 * that toggle functionality is only shown after meaningful
 * user engagement with the swipe feature.
 */
export class SwipeInteractionTracker {
  private static instance: SwipeInteractionTracker;
  private hasSwipedToCalendar: boolean = false;
  private hasSwipedToSaved: boolean = false;
  private hasSwipedPassed: boolean = false;
  private swipeHistory: Array<{ direction: SwipeDirection; timestamp: Date }> =
    [];

  private constructor() {
    // Load persisted state if needed
    this.loadState();
  }

  public static getInstance(): SwipeInteractionTracker {
    if (!SwipeInteractionTracker.instance) {
      SwipeInteractionTracker.instance = new SwipeInteractionTracker();
    }
    return SwipeInteractionTracker.instance;
  }

  /**
   * Record a swipe interaction
   */
  public recordSwipe(direction: SwipeDirection): void {
    // Add to history
    this.swipeHistory.push({
      direction,
      timestamp: new Date(),
    });

    // Update flags based on swipe direction
    switch (direction) {
      case SwipeDirection.RIGHT:
      case SwipeDirection.UP:
        this.hasSwipedToCalendar = true;
        break;
      case SwipeDirection.DOWN:
        this.hasSwipedToSaved = true;
        break;
      case SwipeDirection.LEFT:
        this.hasSwipedPassed = true;
        break;
    }

    // Persist state
    this.saveState();
  }

  /**
   * Check if user has performed any swipe that adds events to calendar
   * (RIGHT = private calendar, UP = public calendar)
   */
  public hasPerformedCalendarSwipe(): boolean {
    return this.hasSwipedToCalendar;
  }

  /**
   * Check if user has performed any swipe interaction at all
   */
  public hasPerformedAnySwipe(): boolean {
    return (
      this.hasSwipedToCalendar || this.hasSwipedToSaved || this.hasSwipedPassed
    );
  }

  /**
   * Check if user has saved events (DOWN swipes)
   */
  public hasPerformedSaveSwipe(): boolean {
    return this.hasSwipedToSaved;
  }

  /**
   * Get count of swipes by direction
   */
  public getSwipeCount(direction: SwipeDirection): number {
    return this.swipeHistory.filter(entry => entry.direction === direction)
      .length;
  }

  /**
   * Get total swipe count
   */
  public getTotalSwipeCount(): number {
    return this.swipeHistory.length;
  }

  /**
   * Get swipe statistics
   */
  public getSwipeStats(): {
    total: number;
    calendarSwipes: number;
    saveSwipes: number;
    passSwipes: number;
    hasEngaged: boolean;
    shouldShowToggle: boolean;
  } {
    const calendarSwipes =
      this.getSwipeCount(SwipeDirection.RIGHT) +
      this.getSwipeCount(SwipeDirection.UP);
    const saveSwipes = this.getSwipeCount(SwipeDirection.DOWN);
    const passSwipes = this.getSwipeCount(SwipeDirection.LEFT);

    return {
      total: this.getTotalSwipeCount(),
      calendarSwipes,
      saveSwipes,
      passSwipes,
      hasEngaged: this.hasPerformedAnySwipe(),
      shouldShowToggle: this.hasPerformedCalendarSwipe(),
    };
  }

  /**
   * Reset all tracking data (useful for testing or user reset)
   */
  public reset(): void {
    this.hasSwipedToCalendar = false;
    this.hasSwipedToSaved = false;
    this.hasSwipedPassed = false;
    this.swipeHistory = [];
    this.saveState();
  }

  /**
   * Get recent swipe activity (last N swipes)
   */
  public getRecentSwipes(
    count: number = 10
  ): Array<{ direction: SwipeDirection; timestamp: Date }> {
    return this.swipeHistory
      .slice(-count)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Check if user has reached a certain engagement level
   */
  public getEngagementLevel(): 'none' | 'minimal' | 'moderate' | 'high' {
    const total = this.getTotalSwipeCount();

    if (total === 0) return 'none';
    if (total <= 3) return 'minimal';
    if (total <= 10) return 'moderate';
    return 'high';
  }

  /**
   * Load persisted state from storage
   */
  private loadState(): void {
    try {
      // In a real implementation, this would load from AsyncStorage
      // For now, we'll keep it in memory only
      // const stored = await AsyncStorage.getItem('swipe_interaction_state');
      // if (stored) {
      //   const state = JSON.parse(stored);
      //   this.hasSwipedToCalendar = state.hasSwipedToCalendar || false;
      //   this.hasSwipedToSaved = state.hasSwipedToSaved || false;
      //   this.hasSwipedPassed = state.hasSwipedPassed || false;
      //   this.swipeHistory = (state.swipeHistory || []).map(entry => ({
      //     ...entry,
      //     timestamp: new Date(entry.timestamp)
      //   }));
      // }
    } catch (error) {
      // Failed to load swipe interaction state
    }
  }

  /**
   * Save state to persistent storage
   */
  private saveState(): void {
    try {
      // In a real implementation, this would save to AsyncStorage
      // const state = {
      //   hasSwipedToCalendar: this.hasSwipedToCalendar,
      //   hasSwipedToSaved: this.hasSwipedToSaved,
      //   hasSwipedPassed: this.hasSwipedPassed,
      //   swipeHistory: this.swipeHistory
      // };
      // await AsyncStorage.setItem('swipe_interaction_state', JSON.stringify(state));
    } catch (error) {
      // Failed to save swipe interaction state
    }
  }

  /**
   * Export state for debugging/testing
   */
  public exportState(): object {
    return {
      hasSwipedToCalendar: this.hasSwipedToCalendar,
      hasSwipedToSaved: this.hasSwipedToSaved,
      hasSwipedPassed: this.hasSwipedPassed,
      swipeHistory: this.swipeHistory,
      stats: this.getSwipeStats(),
    };
  }
}
