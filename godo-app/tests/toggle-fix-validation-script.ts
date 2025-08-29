/**
 * Toggle Behavior Fix Validation Script
 * 
 * This script validates that the toggle behavior fix is working correctly
 * by testing the SwipeInteractionTracker integration and toggle visibility logic.
 */

import { SwipeInteractionTracker } from '../src/services/SwipeInteractionTracker';
import { SwipeDirection } from '../src/types';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class ToggleFixValidator {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Toggle Behavior Fix Validation Tests\n');
    
    // Reset tracker for clean testing
    SwipeInteractionTracker.getInstance().reset();

    await this.testInitialState();
    await this.testRightSwipeTracking();
    await this.testUpSwipeTracking();
    await this.testDownSwipeNoToggle();
    await this.testLeftSwipeNoToggle();
    await this.testMixedSwipes();
    await this.testReset();
    await this.testEngagementLevels();
    
    this.printResults();
  }

  private async testInitialState(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const hasEngaged = tracker.hasPerformedAnySwipe();
      
      this.results.push({
        testName: 'Initial State - No Toggle',
        passed: !shouldShow && !hasEngaged,
        details: {
          shouldShowToggle: shouldShow,
          hasEngaged: hasEngaged,
          stats: tracker.getSwipeStats()
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Initial State - No Toggle',
        passed: false,
        error: error.message
      });
    }
  }

  private async testRightSwipeTracking(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Perform right swipe (should enable toggle)
      tracker.recordSwipe(SwipeDirection.RIGHT);
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Right Swipe - Toggle Should Appear',
        passed: shouldShow && stats.shouldShowToggle && stats.calendarSwipes === 1,
        details: {
          shouldShowToggle: shouldShow,
          calendarSwipes: stats.calendarSwipes,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Right Swipe - Toggle Should Appear',
        passed: false,
        error: error.message
      });
    }
  }

  private async testUpSwipeTracking(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Reset and test up swipe
      tracker.reset();
      tracker.recordSwipe(SwipeDirection.UP);
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Up Swipe - Toggle Should Appear',
        passed: shouldShow && stats.shouldShowToggle && stats.calendarSwipes === 1,
        details: {
          shouldShowToggle: shouldShow,
          calendarSwipes: stats.calendarSwipes,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Up Swipe - Toggle Should Appear',
        passed: false,
        error: error.message
      });
    }
  }

  private async testDownSwipeNoToggle(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Reset and test down swipe only
      tracker.reset();
      tracker.recordSwipe(SwipeDirection.DOWN);
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const hasEngaged = tracker.hasPerformedAnySwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Down Swipe Only - No Toggle',
        passed: !shouldShow && hasEngaged && stats.saveSwipes === 1 && stats.calendarSwipes === 0,
        details: {
          shouldShowToggle: shouldShow,
          hasEngaged: hasEngaged,
          saveSwipes: stats.saveSwipes,
          calendarSwipes: stats.calendarSwipes,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Down Swipe Only - No Toggle',
        passed: false,
        error: error.message
      });
    }
  }

  private async testLeftSwipeNoToggle(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Reset and test left swipe only
      tracker.reset();
      tracker.recordSwipe(SwipeDirection.LEFT);
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const hasEngaged = tracker.hasPerformedAnySwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Left Swipe Only - No Toggle',
        passed: !shouldShow && hasEngaged && stats.passSwipes === 1 && stats.calendarSwipes === 0,
        details: {
          shouldShowToggle: shouldShow,
          hasEngaged: hasEngaged,
          passSwipes: stats.passSwipes,
          calendarSwipes: stats.calendarSwipes,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Left Swipe Only - No Toggle',
        passed: false,
        error: error.message
      });
    }
  }

  private async testMixedSwipes(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Reset and perform mixed swipes
      tracker.reset();
      tracker.recordSwipe(SwipeDirection.RIGHT); // Calendar
      tracker.recordSwipe(SwipeDirection.DOWN);  // Save
      tracker.recordSwipe(SwipeDirection.UP);    // Calendar
      tracker.recordSwipe(SwipeDirection.LEFT);  // Pass
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Mixed Swipes - Toggle Appears',
        passed: shouldShow && 
                stats.shouldShowToggle && 
                stats.calendarSwipes === 2 && 
                stats.saveSwipes === 1 && 
                stats.passSwipes === 1 &&
                stats.total === 4,
        details: {
          shouldShowToggle: shouldShow,
          expectedCalendarSwipes: 2,
          actualCalendarSwipes: stats.calendarSwipes,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Mixed Swipes - Toggle Appears',
        passed: false,
        error: error.message
      });
    }
  }

  private async testReset(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Perform some swipes then reset
      tracker.recordSwipe(SwipeDirection.RIGHT);
      tracker.recordSwipe(SwipeDirection.UP);
      tracker.reset();
      
      const shouldShow = tracker.hasPerformedCalendarSwipe();
      const hasEngaged = tracker.hasPerformedAnySwipe();
      const stats = tracker.getSwipeStats();
      
      this.results.push({
        testName: 'Reset Function - Clean State',
        passed: !shouldShow && 
                !hasEngaged && 
                stats.total === 0 && 
                stats.calendarSwipes === 0,
        details: {
          shouldShowToggle: shouldShow,
          hasEngaged: hasEngaged,
          stats: stats
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Reset Function - Clean State',
        passed: false,
        error: error.message
      });
    }
  }

  private async testEngagementLevels(): Promise<void> {
    try {
      const tracker = SwipeInteractionTracker.getInstance();
      
      // Test different engagement levels
      tracker.reset();
      let level = tracker.getEngagementLevel();
      const noneLevel = level === 'none';
      
      // Add minimal engagement
      tracker.recordSwipe(SwipeDirection.RIGHT);
      level = tracker.getEngagementLevel();
      const minimalLevel = level === 'minimal';
      
      // Add more swipes for moderate
      for (let i = 0; i < 5; i++) {
        tracker.recordSwipe(SwipeDirection.UP);
      }
      level = tracker.getEngagementLevel();
      const moderateLevel = level === 'moderate';
      
      this.results.push({
        testName: 'Engagement Levels - Correct Classification',
        passed: noneLevel && minimalLevel && moderateLevel,
        details: {
          noneLevel,
          minimalLevel,
          moderateLevel,
          finalLevel: level,
          totalSwipes: tracker.getTotalSwipeCount()
        }
      });
    } catch (error) {
      this.results.push({
        testName: 'Engagement Levels - Correct Classification',
        passed: false,
        error: error.message
      });
    }
  }

  private printResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}/${total} (${((passed/total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    console.log('\n📋 Detailed Results:');
    
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`\n${index + 1}. ${status} ${result.testName}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    });

    console.log('\n' + '='.repeat(60));
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Toggle behavior fix is working correctly.');
    } else {
      console.log('🚨 SOME TESTS FAILED! Review the implementation.');
    }
  }
}

// Test scenario simulation functions
export const simulateUserFlow = {
  newUser: () => {
    const tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
    console.log('👤 New User: No swipes performed');
    console.log('Should show toggle:', tracker.hasPerformedCalendarSwipe()); // false
  },

  firstRightSwipe: () => {
    const tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
    tracker.recordSwipe(SwipeDirection.RIGHT);
    console.log('📅 User performed first right swipe (private calendar)');
    console.log('Should show toggle:', tracker.hasPerformedCalendarSwipe()); // true
  },

  firstUpSwipe: () => {
    const tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
    tracker.recordSwipe(SwipeDirection.UP);
    console.log('👥 User performed first up swipe (public calendar)');
    console.log('Should show toggle:', tracker.hasPerformedCalendarSwipe()); // true
  },

  onlySaveSwipes: () => {
    const tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
    tracker.recordSwipe(SwipeDirection.DOWN);
    tracker.recordSwipe(SwipeDirection.DOWN);
    console.log('🔖 User only performed save swipes');
    console.log('Should show toggle:', tracker.hasPerformedCalendarSwipe()); // false
  },

  onlyPassSwipes: () => {
    const tracker = SwipeInteractionTracker.getInstance();
    tracker.reset();
    tracker.recordSwipe(SwipeDirection.LEFT);
    tracker.recordSwipe(SwipeDirection.LEFT);
    console.log('❌ User only passed on events');
    console.log('Should show toggle:', tracker.hasPerformedCalendarSwipe()); // false
  }
};

// Run tests if script is executed directly
if (require.main === module) {
  const validator = new ToggleFixValidator();
  validator.runAllTests().catch(console.error);
}

export { ToggleFixValidator };