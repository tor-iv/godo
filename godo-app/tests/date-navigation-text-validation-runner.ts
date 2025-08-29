/**
 * DateNavigation Responsive Text Formatting Validation Runner
 * 
 * This script validates that the responsive text formatting in DateNavigation
 * works correctly across different screen sizes and view types.
 */

import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

interface ValidationResult {
  testName: string;
  passed: boolean;
  expected: string;
  actual?: string;
  error?: string;
}

interface TestScenario {
  screenWidth: number;
  viewType: 'day' | 'week' | 'month' | 'agenda';
  selectedDate: string;
  description: string;
  expectedPatterns: RegExp[];
  expectedCharRange: [number, number]; // [min, max] characters
}

class DateNavigationTextValidator {
  private results: ValidationResult[] = [];
  
  // Simulate the component's text formatting logic
  private calculateAvailableWidth(screenWidth: number, isToday: boolean = false): number {
    const navigationButtonWidth = 44 * 2; // Left and right arrows
    const paddingWidth = 16 * 2; // Container padding (spacing[4])
    const todayButtonWidth = isToday ? 0 : 80; // Today button when visible
    const calendarIconWidth = 24; // Calendar icon space
    const margins = 8 * 2; // Title container margins (spacing[2])

    return screenWidth - navigationButtonWidth - paddingWidth - todayButtonWidth - calendarIconWidth - margins;
  }

  private shouldShowYear(selectedDate: Date): boolean {
    const currentYear = new Date().getFullYear();
    const selectedYear = getYear(selectedDate);
    const isNearYearBoundary = selectedDate.getMonth() === 0 || selectedDate.getMonth() === 11;

    return selectedYear !== currentYear || isNearYearBoundary;
  }

  private getResponsiveDisplayText(
    viewType: 'day' | 'week' | 'month' | 'agenda',
    selectedDate: Date,
    availableWidth: number
  ): string {
    const avgCharWidth = 8; // Approximate character width
    const maxChars = Math.floor(availableWidth / avgCharWidth);

    switch (viewType) {
      case 'day': {
        const showYear = this.shouldShowYear(selectedDate);

        if (maxChars < 10) {
          // Ultra compact
          return maxChars < 7
            ? format(selectedDate, 'M/d')
            : format(selectedDate, 'MMM d');
        }
        if (maxChars < 14) {
          // Compact
          return (
            format(selectedDate, 'EEE, MMM d') +
            (showYear ? `, ${format(selectedDate, 'yy')}` : '')
          );
        }
        if (maxChars < 20) {
          // Standard
          return (
            format(selectedDate, 'EEEE, MMM d') +
            (showYear ? `, ${format(selectedDate, 'yy')}` : '')
          );
        }
        // Full
        return format(
          selectedDate,
          showYear ? 'EEEE, MMMM d, yyyy' : 'EEEE, MMMM d'
        );
      }

      case 'week': {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();
        const isSameYear = weekStart.getFullYear() === weekEnd.getFullYear();
        const showYear = this.shouldShowYear(selectedDate);
        const weekNumber = getWeek(selectedDate, { weekStartsOn: 1 });

        if (maxChars < 10) {
          // Ultra compact
          return maxChars < 7
            ? `W${weekNumber}`
            : `${format(weekStart, 'd')}-${format(weekEnd, 'd')}`;
        }
        if (maxChars < 14) {
          // Compact
          if (isSameMonth) {
            return `${format(weekStart, 'd')}-${format(weekEnd, 'd')} ${format(weekStart, 'MMM')}`;
          }
          return `${format(weekStart, 'd')} ${format(weekStart, 'MMM')}-${format(weekEnd, 'd')} ${format(weekEnd, 'MMM')}`;
        }
        if (maxChars < 18) {
          // Standard
          if (isSameMonth) {
            return (
              `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}` +
              (showYear ? ` '${format(weekStart, 'yy')}` : '')
            );
          }
          return (
            `${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}` +
            (showYear && !isSameYear ? ` '${format(weekEnd, 'yy')}` : '')
          );
        }
        // Full
        if (isSameMonth) {
          return `${format(weekStart, 'MMMM d')}-${format(weekEnd, 'd')}${showYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
        }
        if (isSameYear) {
          return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d')}${showYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
        }
        return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }

      case 'month':
        return format(selectedDate, this.shouldShowYear(selectedDate) ? 'MMMM yyyy' : 'MMMM');

      case 'agenda':
        return 'Upcoming Events';

      default:
        return format(selectedDate, 'MMM d, yyyy');
    }
  }

  private runTest(scenario: TestScenario): ValidationResult {
    try {
      const selectedDate = new Date(scenario.selectedDate);
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      const availableWidth = this.calculateAvailableWidth(scenario.screenWidth, isToday);
      const actualText = this.getResponsiveDisplayText(scenario.viewType, selectedDate, availableWidth);

      // Check if text matches expected patterns
      const patternMatch = scenario.expectedPatterns.some(pattern => pattern.test(actualText));
      
      // Check if text length is within expected range
      const withinRange = actualText.length >= scenario.expectedCharRange[0] && 
                         actualText.length <= scenario.expectedCharRange[1];

      const passed = patternMatch && withinRange;

      return {
        testName: `${scenario.description} (${scenario.screenWidth}px, ${scenario.viewType})`,
        passed,
        expected: `Patterns: ${scenario.expectedPatterns.map(p => p.toString()).join(' OR ')}, Length: ${scenario.expectedCharRange[0]}-${scenario.expectedCharRange[1]} chars`,
        actual: `"${actualText}" (${actualText.length} chars)`,
      };
    } catch (error) {
      return {
        testName: `${scenario.description} (${scenario.screenWidth}px, ${scenario.viewType})`,
        passed: false,
        expected: 'Valid responsive text',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public validate(): void {
    const testScenarios: TestScenario[] = [
      // Day View Tests
      {
        screenWidth: 280,
        viewType: 'day',
        selectedDate: '2025-01-15',
        description: 'Ultra compact day view',
        expectedPatterns: [/^\d+\/\d+$/, /^[A-Za-z]{3} \d+$/],
        expectedCharRange: [4, 8],
      },
      {
        screenWidth: 320,
        viewType: 'day',
        selectedDate: '2025-01-15',
        description: 'Compact day view',
        expectedPatterns: [/^[A-Za-z]{3}, [A-Za-z]{3} \d+/],
        expectedCharRange: [10, 16],
      },
      {
        screenWidth: 375,
        viewType: 'day',
        selectedDate: '2025-01-15',
        description: 'Standard day view',
        expectedPatterns: [/^[A-Za-z]+, [A-Za-z]{3} \d+/],
        expectedCharRange: [12, 20],
      },
      {
        screenWidth: 768,
        viewType: 'day',
        selectedDate: '2025-01-15',
        description: 'Full day view',
        expectedPatterns: [/^[A-Za-z]+, [A-Za-z]+ \d+/],
        expectedCharRange: [15, 30],
      },

      // Week View Tests
      {
        screenWidth: 280,
        viewType: 'week',
        selectedDate: '2025-01-15',
        description: 'Ultra compact week view',
        expectedPatterns: [/^W\d+$/, /^\d+-\d+$/],
        expectedCharRange: [3, 7],
      },
      {
        screenWidth: 320,
        viewType: 'week',
        selectedDate: '2025-01-15',
        description: 'Compact week view',
        expectedPatterns: [/^\d+-\d+ [A-Za-z]{3}$/],
        expectedCharRange: [8, 12],
      },
      {
        screenWidth: 375,
        viewType: 'week',
        selectedDate: '2025-01-15',
        description: 'Standard week view',
        expectedPatterns: [/^[A-Za-z]{3} \d+-\d+/],
        expectedCharRange: [8, 16],
      },
      {
        screenWidth: 768,
        viewType: 'week',
        selectedDate: '2025-01-15',
        description: 'Full week view',
        expectedPatterns: [/^[A-Za-z]+ \d+-\d+/],
        expectedCharRange: [12, 25],
      },

      // Cross-Month Week Tests
      {
        screenWidth: 350,
        viewType: 'week',
        selectedDate: '2025-01-01',
        description: 'Cross-month week compact',
        expectedPatterns: [/\d+ [A-Za-z]{3}-\d+ [A-Za-z]{3}/],
        expectedCharRange: [10, 18],
      },
      {
        screenWidth: 400,
        viewType: 'week',
        selectedDate: '2025-01-01',
        description: 'Cross-month week standard',
        expectedPatterns: [/[A-Za-z]{3} \d+-[A-Za-z]{3} \d+/],
        expectedCharRange: [10, 20],
      },

      // Year Display Tests
      {
        screenWidth: 375,
        viewType: 'day',
        selectedDate: '2024-06-15',
        description: 'Different year display',
        expectedPatterns: [/2024|'24/],
        expectedCharRange: [12, 25],
      },
      {
        screenWidth: 375,
        viewType: 'day',
        selectedDate: '2025-12-15',
        description: 'December year display',
        expectedPatterns: [/2025|'25/],
        expectedCharRange: [12, 25],
      },

      // Month View Tests
      {
        screenWidth: 280,
        viewType: 'month',
        selectedDate: '2025-01-15',
        description: 'Compact month view',
        expectedPatterns: [/^[A-Za-z]{3,}$/],
        expectedCharRange: [3, 12],
      },
      {
        screenWidth: 768,
        viewType: 'month',
        selectedDate: '2025-01-15',
        description: 'Full month view',
        expectedPatterns: [/^[A-Za-z]+ \d{4}$/],
        expectedCharRange: [8, 15],
      },

      // Agenda View Test
      {
        screenWidth: 375,
        viewType: 'agenda',
        selectedDate: '2025-01-15',
        description: 'Agenda view',
        expectedPatterns: [/^Upcoming Events$/],
        expectedCharRange: [15, 15],
      },

      // Edge Cases
      {
        screenWidth: 240,
        viewType: 'week',
        selectedDate: '2025-01-15',
        description: 'Extremely narrow week view',
        expectedPatterns: [/^W\d+$/],
        expectedCharRange: [3, 4],
      },
      {
        screenWidth: 1200,
        viewType: 'day',
        selectedDate: '2025-01-15',
        description: 'Very wide screen day view',
        expectedPatterns: [/^[A-Za-z]+, [A-Za-z]+ \d+/],
        expectedCharRange: [15, 35],
      },
    ];

    console.log('🧪 Running DateNavigation Responsive Text Validation...\n');

    testScenarios.forEach(scenario => {
      const result = this.runTest(scenario);
      this.results.push(result);

      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      
      if (!result.passed) {
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      console.log('');
    });

    this.printSummary();
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log('📊 Validation Summary');
    console.log('═'.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${passRate}%`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! The responsive text formatting is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
      
      // Group failures by category
      const failures = this.results.filter(r => !r.passed);
      const failuresByView = failures.reduce((acc, failure) => {
        const viewType = failure.testName.match(/\(.*?, (\w+)\)/)?.[1] || 'unknown';
        acc[viewType] = (acc[viewType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\nFailures by View Type:');
      Object.entries(failuresByView).forEach(([view, count]) => {
        console.log(`  ${view}: ${count} failure(s)`);
      });
    }

    // Performance insights
    console.log('\n🔍 Performance Insights:');
    const dayTests = this.results.filter(r => r.testName.includes('day'));
    const weekTests = this.results.filter(r => r.testName.includes('week'));
    
    console.log(`Day View Tests: ${dayTests.filter(r => r.passed).length}/${dayTests.length} passed`);
    console.log(`Week View Tests: ${weekTests.filter(r => r.passed).length}/${weekTests.length} passed`);
    
    // Screen size coverage
    const screenSizes = [...new Set(this.results.map(r => {
      const match = r.testName.match(/\((\d+)px/);
      return match ? parseInt(match[1]) : 0;
    }))].sort((a, b) => a - b);
    
    console.log(`Screen Sizes Tested: ${screenSizes.join('px, ')}px`);
  }

  public getResults(): ValidationResult[] {
    return [...this.results];
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new DateNavigationTextValidator();
  validator.validate();

  // Exit with error code if tests failed
  const results = validator.getResults();
  const hasFailures = results.some(r => !r.passed);
  process.exit(hasFailures ? 1 : 0);
}

export { DateNavigationTextValidator, ValidationResult, TestScenario };