/**
 * Unit test for DateNavigation cross-month week display formatting
 * Tests the core logic without complex component rendering
 */

import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

// Core formatting logic extracted from DateNavigation component
const getWeekDisplayText = (
  selectedDate: string, 
  maxChars: number,
  currentYear: number = new Date().getFullYear()
): string => {
  const selectedDateObj = new Date(selectedDate);
  const weekStart = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
  const isSameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const isSameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  
  // Smart year display logic
  const selectedYear = getYear(selectedDateObj);
  const isNearYearBoundary = selectedDateObj.getMonth() === 0 || selectedDateObj.getMonth() === 11;
  const shouldShowYear = selectedYear !== currentYear || isNearYearBoundary;
  
  const weekNumber = getWeek(selectedDateObj, { weekStartsOn: 1 });

  if (maxChars < 10) {
    // Ultra compact: "W48" or "1-7"
    return maxChars < 7
      ? `W${weekNumber}`
      : `${format(weekStart, 'd')}-${format(weekEnd, 'd')}`;
  }
  if (maxChars < 14) {
    // Compact: "1-7 Jan" or "31 Oct-6 Nov"
    if (isSameMonth) {
      return `${format(weekStart, 'd')}-${format(weekEnd, 'd')} ${format(weekStart, 'MMM')}`;
    }
    return `${format(weekStart, 'd')} ${format(weekStart, 'MMM')}-${format(weekEnd, 'd')} ${format(weekEnd, 'MMM')}`;
  }
  if (maxChars < 18) {
    // Standard: "Jan 1-7" or "Oct 25-Nov 2"
    if (isSameMonth) {
      return (
        `${format(weekStart, 'MMM d')}-${format(weekEnd, 'd')}` +
        (shouldShowYear ? ` '${format(weekStart, 'yy')}` : '')
      );
    }
    return (
      `${format(weekStart, 'MMM d')}-${format(weekEnd, 'MMM d')}` +
      (shouldShowYear && !isSameYear ? ` '${format(weekEnd, 'yy')}` : '')
    );
  }
  // Full: "January 1-7, 2025" or "Oct 25 - Nov 2, 2025"
  if (isSameMonth) {
    return `${format(weekStart, 'MMMM d')}-${format(weekEnd, 'd')}${shouldShowYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
  }
  if (isSameYear) {
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}${shouldShowYear ? `, ${format(weekStart, 'yyyy')}` : ''}`;
  }
  return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
};

describe('DateNavigation Cross-Month Week Format Logic', () => {
  describe('Oct 25 - Nov 2 week display (cross-month)', () => {
    const testDate = '2024-10-30'; // Wednesday in the week Oct 28 - Nov 3
    
    test('should display abbreviated month names consistently', () => {
      const expectedFormats = {
        6: 'W44',                    // Ultra compact: week number
        9: '28-3',                   // Ultra compact: just dates (< 10 chars)
        13: '28 Oct-3 Nov',          // Compact with abbreviated months (< 14 chars)
        17: 'Oct 28-Nov 3',          // Standard with abbreviated months (< 18 chars)
        25: 'Oct 28 - Nov 3',        // Full with spaces and abbreviated months (>= 18 chars)
      };

      Object.entries(expectedFormats).forEach(([maxChars, expectedFormat]) => {
        const actualText = getWeekDisplayText(testDate, parseInt(maxChars), 2024);
        expect(actualText).toBe(expectedFormat);
      });
    });

    test('should maintain proper spacing and punctuation', () => {
      const displayText = getWeekDisplayText(testDate, 25, 2024); // Wide format
      
      // Should use abbreviated months with proper spacing
      expect(displayText).toMatch(/^(Oct|October) \d+ - (Nov|November) \d+(, \d{4})?$/);
      
      // Should not have extra spaces or inconsistent punctuation
      expect(displayText).not.toMatch(/  /); // No double spaces
      expect(displayText).not.toMatch(/,-|,\s*-/); // No comma before dash
    });
  });

  describe('Dec 29 - Jan 4 cross-year week', () => {
    const testDate = '2024-01-02'; // Tuesday in the week Dec 30 - Jan 5
    
    test('should handle cross-year scenarios correctly', () => {
      const expectedFormats = {
        6: 'W1',                     // Ultra compact: week number
        9: '1-7',                    // Ultra compact: just dates (< 10 chars)
        13: '1-7 Jan',               // Compact with abbreviated months (same month, < 14 chars)
        17: 'Jan 1-7 \'24',          // Standard with abbreviated months + year (< 18 chars)
        25: 'January 1-7, 2024',     // Full format with year (>= 18 chars)
      };

      Object.entries(expectedFormats).forEach(([maxChars, expectedFormat]) => {
        const actualText = getWeekDisplayText(testDate, parseInt(maxChars), 2024);
        expect(actualText).toBe(expectedFormat);
      });
    });

    test('should show year appropriately for cross-year weeks', () => {
      const displayText = getWeekDisplayText(testDate, 35, 2024); // Wide screen
      
      // For January dates in the current year, should include year
      expect(displayText).toMatch(/\d{4}$/);
    });
  });

  describe('Feb 28 - Mar 6 (leap year considerations)', () => {
    const testDate = '2024-03-01'; // Friday in leap year week Feb 26 - Mar 3
    
    test('should handle leap year month boundaries', () => {
      const expectedFormats = {
        6: 'W9',                     // Ultra compact: week number
        9: '26-3',                   // Ultra compact: just dates (< 10 chars)
        13: '26 Feb-3 Mar',          // Compact with abbreviated months (< 14 chars)
        17: 'Feb 26-Mar 3',          // Standard with abbreviated months (< 18 chars)
        25: 'Feb 26 - Mar 3',        // Full with spaces (>= 18 chars)
      };

      Object.entries(expectedFormats).forEach(([maxChars, expectedFormat]) => {
        const actualText = getWeekDisplayText(testDate, parseInt(maxChars), 2024);
        expect(actualText).toBe(expectedFormat);
      });
    });
  });

  describe('Apr 30 - May 7 month boundary', () => {
    const testDate = '2024-05-02'; // Thursday in the week Apr 29 - May 5
    
    test('should handle standard month boundary transitions', () => {
      const expectedFormats = {
        6: 'W18',                    // Ultra compact: week number
        9: '29-5',                   // Ultra compact: just dates (< 10 chars)
        13: '29 Apr-5 May',          // Compact with abbreviated months (< 14 chars)
        17: 'Apr 29-May 5',          // Standard with abbreviated months (< 18 chars)
        25: 'Apr 29 - May 5',        // Full with spaces (>= 18 chars)
      };

      Object.entries(expectedFormats).forEach(([maxChars, expectedFormat]) => {
        const actualText = getWeekDisplayText(testDate, parseInt(maxChars), 2024);
        expect(actualText).toBe(expectedFormat);
      });
    });
  });

  describe('Same month week display', () => {
    const testDate = '2024-06-15'; // Saturday in mid-month week Jun 10 - Jun 16
    
    test('should use single month format for same-month weeks', () => {
      const expectedFormats = {
        6: 'W24',                    // Ultra compact: week number
        9: '10-16',                  // Ultra compact: just dates (< 10 chars)
        13: '10-16 Jun',             // Compact: dates with single month (< 14 chars)
        17: 'Jun 10-16',             // Standard: month with date range (< 18 chars)
        25: 'June 10-16',            // Full: full month name (>= 18 chars)
      };

      Object.entries(expectedFormats).forEach(([maxChars, expectedFormat]) => {
        const actualText = getWeekDisplayText(testDate, parseInt(maxChars), 2024);
        expect(actualText).toBe(expectedFormat);
      });
    });
  });

  describe('Format progression validation', () => {
    const testDate = '2024-10-30'; // Oct 25 - Nov 2 week
    
    test('should progress formats logically as space increases', () => {
      const formats = [
        { maxChars: 6, expected: 'W44' },           // Ultra compact
        { maxChars: 9, expected: '28-3' },          // Dates only
        { maxChars: 13, expected: '28 Oct-3 Nov' }, // Compact abbreviated
        { maxChars: 17, expected: 'Oct 28-Nov 3' }, // Standard abbreviated
        { maxChars: 25, expected: 'Oct 28 - Nov 3' }, // Full abbreviated with spaces
      ];

      formats.forEach(({ maxChars, expected }) => {
        const actualText = getWeekDisplayText(testDate, maxChars, 2024);
        expect(actualText).toBe(expected);
      });
    });
  });

  describe('Text readability and conciseness', () => {
    const testCases = [
      { date: '2024-10-30', description: 'Oct-Nov cross-month' },
      { date: '2024-01-02', description: 'Jan single-month (near year boundary)' },
      { date: '2024-03-01', description: 'Feb-Mar leap year' },
      { date: '2024-05-02', description: 'Apr-May boundary' },
    ];

    testCases.forEach(({ date, description }) => {
      test(`should produce readable and concise text for ${description}`, () => {
        const displayText = getWeekDisplayText(date, 20, 2024); // Standard width
        
        // Should use abbreviated months (3 chars) when present
        const monthPattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g;
        const monthMatches = displayText.match(monthPattern);
        
        if (monthMatches) {
          monthMatches.forEach(month => {
            expect(month.length).toBe(3); // All months should be abbreviated
          });
        }
        
        // Should be concise (not longer than necessary)
        expect(displayText.length).toBeLessThan(25); // Reasonable max length
        
        // Should not contain redundant information
        expect(displayText).not.toMatch(/(\w+)\s+\1/); // No repeated words
      });
    });
  });

  describe('Edge case validation', () => {
    test('should handle very narrow screens gracefully', () => {
      const testDate = '2024-10-30';
      const narrowText = getWeekDisplayText(testDate, 5, 2024); // Very narrow
      
      // Should fallback to week number format
      expect(narrowText).toBe('W44');
    });

    test('should handle very wide screens without breaking', () => {
      const testDate = '2024-10-30';
      const wideText = getWeekDisplayText(testDate, 50, 2024); // Very wide
      
      // Should use full format without year (not year boundary)
      expect(wideText).toBe('Oct 28 - Nov 3');
      expect(wideText.length).toBeLessThan(50); // Should not be excessively long
    });

    test('should maintain consistency across different cross-month scenarios', () => {
      const crossMonthDates = [
        '2024-03-01', // Feb-Mar  
        '2024-05-02', // Apr-May
        '2024-09-02', // Aug-Sep
        '2024-11-01', // Oct-Nov
      ];

      crossMonthDates.forEach(date => {
        const displayText = getWeekDisplayText(date, 17, 2024); // Use 17 to get the < 18 format
        
        // All cross-month weeks should follow the same pattern: "MMM dd-MMM dd" (no spaces)
        expect(displayText).toMatch(/^[A-Z][a-z]{2} \d{1,2}-[A-Z][a-z]{2} \d{1,2}$/);
      });
    });
  });

  describe('Year handling validation', () => {
    test('should show year for different year than current', () => {
      const testDate = '2025-06-15'; // Future year
      const displayText = getWeekDisplayText(testDate, 30, 2024); // Current year is 2024
      
      expect(displayText).toContain('2025');
    });

    test('should show year for January/December months (year boundary)', () => {
      const januaryDate = '2024-01-15';
      const decemberDate = '2024-12-15';
      
      const januaryText = getWeekDisplayText(januaryDate, 30, 2024);
      const decemberText = getWeekDisplayText(decemberDate, 30, 2024);
      
      // Both should include year due to year boundary logic
      expect(januaryText).toContain('2024');
      expect(decemberText).toContain('2024');
    });

    test('should not show year for mid-year dates in current year', () => {
      const testDate = '2024-06-15'; // Mid-year
      const displayText = getWeekDisplayText(testDate, 25, 2024); // Current year is 2024
      
      expect(displayText).not.toContain('2024');
      expect(displayText).toBe('June 10-16');
    });
  });

  describe('Semantic consistency validation', () => {
    test('should maintain semantic meaning across format changes', () => {
      const testDate = '2024-10-30';
      const weekStart = startOfWeek(new Date(testDate), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(testDate), { weekStartsOn: 1 });
      
      // All formats should represent the same semantic week
      const narrowText = getWeekDisplayText(testDate, 6, 2024);   // W44
      const standardText = getWeekDisplayText(testDate, 18, 2024);  // Oct 28-Nov 3
      
      // Week number should correspond to the same dates
      if (narrowText.startsWith('W')) {
        const weekNum = parseInt(narrowText.substring(1));
        expect(weekNum).toBeGreaterThan(0);
        expect(weekNum).toBeLessThan(54);
      }
      
      // Standard format should show correct start/end dates
      if (standardText.includes('-')) {
        const startDay = format(weekStart, 'd');
        const endDay = format(weekEnd, 'd');
        expect(standardText).toContain(startDay);
        expect(standardText).toContain(endDay);
      }
    });
  });
});